//ROUTES
//ORDERS
var loggly = require("loggly"),
    Config = require("../config/server.config");
var log = loggly.createClient(Config.logger);

var myUtils = require("../utils/myUtils"),
    Joi = require("joi"),
    Hapi = require("hapi"),
    Order = require("../models/schema").Order,
    Item = require("../models/schema").Item;

//var Hapi = plugin.hapi;

//ROUTE FOR POSTING ORDERS TO THE DB
exports.postOrders = {
    auth: "session",
    validate: {
        payload: {
            farmer: Joi.string().required(),
            farmerId: Joi.string().required(),
            product: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            quantity: Joi.alternatives().try(Joi.number().min(1), Joi.array().includes(Joi.number().min(1))).required(),
            price: Joi.alternatives().try(Joi.number().min(0), Joi.array().includes(Joi.number().min(0))).required(),
            unit: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            transportation: Joi.string(),
            notes: Joi.string()
        }
    },
    handler: function (req, reply) {
        //vars
        console.log(req.payload.unit);
        var cleanedFarmer,
            cleanedProducts,
            cleanedInitials,
            total = 0.0,
            shippingCosts = 0.0,
            newOrder,
            inventoryItems;
        log.log({METHOD: "Recieved POST"});
        console.log(req.payload);
        //NORMALIZING INPUT
        cleanedFarmer = myUtils.lowerAndTrim(req.payload.farmer);
        cleanedProducts = myUtils.lowerAndTrim(req.payload.product);
        cleanedInitials = myUtils.lowerAndTrim(req.payload.farmerId);

        //TURNING PRODUCTS INTO ARRAY FOR EASIER HANDLING
        cleanedProducts = myUtils.arrayify(cleanedProducts);

        //CALCULATING TOTAL
        if (cleanedProducts.length === 1) {
          //IF ONLY ONE ITEM THE PRICE OF THAT ITEM IS THE TOTAL
            total = req.payload.price * req.payload.quantity;
        } else {
            total = cleanedProducts.reduce(function (prev, curr, index) {
                return prev + (req.payload.price[index] * req.payload.quantity[index]);
            }, total);
        }
        if (!!req.payload.transportation) {
            shippingCosts = Math.max(
                (total * 0.1),
                10
            );
        }
        shippingCosts = myUtils.getShipping(total, !!req.payload.transportation);
        total += shippingCosts;
        //CREATING NEW ORDER OBJECT
        newOrder = new Order({
            farmer: cleanedFarmer,
            farmerId: cleanedInitials,
            products: cleanedProducts,
            quantities: req.payload.quantity,
            prices: req.payload.price,
            notes: req.payload.notes,
            unit: req.payload.unit,
            transportation: !!req.payload.shipping,
            transportationCosts: shippingCosts,
            total: total.toFixed(2)
        });

        //RETURNING AN ARRAY OF ITEM OBJECTS TO LATER SAVE
        inventoryItems = cleanedProducts.map(function (item, index) {
            if (cleanedProducts.length === 1) {
                return new Item({
                    product: item,
                    price: req.payload.price,
                    farmerId: cleanedInitials,
                    quantity: req.payload.quantity,
                    unit: req.payload.unit,
                    farmer: cleanedFarmer
                });
            }
          //IF MORE THAN ONE PRODUCT, MATCHES THE PRODUCT TO ITS RESPECTIVE QUANTITY
          //AND PRICE
            return new Item({
                product: item,
                farmerId: cleanedInitials,
                price: req.payload.price[index],
                unit: req.payload.unit[index],
                quantity: req.payload.quantity[index],
                farmer: cleanedFarmer
            });
        });
        //SAVING THE NEW ITEM TO THE DATABASE
        inventoryItems.forEach(function (item) {
            item.save(function (err, i) {
                if (err) {
                    return log.log({err: err});
                }
                log.log({"New Item:": i});
            });
        });

        //SAVING THE NEW ORDER TO THE DATABASE
        newOrder.save(function (err, order) {
            if (err) {
                return log.log({error: err});
            }
            console.log("Order saved", order);
            log.log({"Order Saved": order});
            reply({"logStatus" : "success"});
        });
    }
};

//ROUTE FOR GETTING ORDERS FROM DB
exports.getOrders = {
    auth: "session",
    validate: {
        params: {
            farmerId: Joi.string()
        }
    },
    handler: function (req, reply) {
        var query = {},
            cleanedFarmerId = "",
            limit;
        if (req.params.farmerId) {
            console.log("params exists");
            cleanedFarmerId = myUtils.lowerAndTrim(req.params.farmerId);
            query = {"farmerId": cleanedFarmerId};
            limit = 1;
        }
        Order.find(query).lean()
            .sort("-date")
            .limit(limit)
            .exec(function (err, order) {
                if (err) {
                    return reply(err);
                }

                if (!order || order === null) {
                    var error;
                    if (cleanedFarmerId) {
                        error = Hapi.error.notFound("Last order by farmer " + cleanedFarmerId + " not found");
                    } else {
                        error = Hapi.error.notFound("No orders found");
                    }
                    return reply(error);
                }

                return reply(order);
            });
    }
};
