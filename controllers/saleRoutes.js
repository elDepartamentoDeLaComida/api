//ROUTES
//SALES
var loggly = require("loggly"),
    Config = require("../config/server.config");
var log = loggly.createClient(Config.logger);
var myUtils = require("../utils/myUtils"),
    Hapi = require("hapi"),
    Joi = require("joi"),
    Sale = require("../models/schema").Sale,
    Item = require("../models/schema").Item;



//ROUTE FOR GETTING A TOTAL FOR THE SALE
exports.getTotal = {
    validate: {
        query: {
            customerName: Joi.string(),
            product: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            quantity: Joi.alternatives().try(Joi.number().min(1), Joi.array().includes(Joi.number().min(1))).required(),
            notes: Joi.string(),
            transportation: Joi.string(),
            delivery: Joi.number().required(),
            farmerId: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
        }
    },
    handler: function (req, reply) {
        log.log({METHOD: "RECIEVED GET"});
        //log.log({req: req});
        //NORMALIZING INPUT
        var cleanedProducts = myUtils.lowerAndTrim(req.query.product);
        var cleanedInitials = myUtils.lowerAndTrim(req.query.farmerId);

        var subtotal = 0,
            total = 0,
            orderNum = 0,
            thisQuantity = 0,
            shippingCosts = 0,
            error;

        cleanedProducts = myUtils.arrayify(cleanedProducts);
        cleanedInitials = myUtils.arrayify(cleanedInitials);

        Sale.count({}, function (err, count) {
            if (err) {
                reply(err);
                log.log({err: err});
            }
            orderNum = count;
        });

      //FOR EACH PRODUCT FINDING ITS PRICE VIA THE MOST RECENT PRODUCT FROM THE FARMER
      //THEN ADDING TI TO THE TOTAL
        cleanedProducts.forEach(function (product, index) {
            Item.findOne({
                "product": product,
                "farmerId": cleanedInitials[index]
            }).lean()
                .select("product price farmer inStock")
                .sort("-date")
                .limit(1)
                .exec(function (err, item) {

                    if (err) {
                        reply(err);
                        return;
                    }

                    //IF PRODUCT IS NOT FOUND
                    if (!item || item === null) {
                        error = Hapi.error.notFound("Product: " + product + " from " +  cleanedInitials[index] + " not found");
                        return reply(error);
                    }

                    if (item.inStock === false) {
                        error = Hapi.error.notFound(item.product + " not in stock");
                        return reply(error);
                    }
                    if (cleanedProducts.length === 1) {
                        thisQuantity = req.query.quantity;
                    } else {
                        thisQuantity = req.query.quantity[index];
                    }

                    //CALCULATING THE TOTAL
                    subtotal += item.price * thisQuantity;

                    //IF IT'S THE LAST ITEM TO CALCULATE, SAVE THE THE STARTED SALE TO DB
                    if (index + 1 === cleanedProducts.length) {
                        console.log("TOTAL", total);

                        shippingCosts = myUtils.getShipping(total, !!req.query.transportation);
                        total = subtotal + shippingCosts + req.query.delivery;
                        var thisSale = new Sale({
                            _id: orderNum,
                            total: total
                        });
                        thisSale.save(function (err) {
                            if (err) {
                                log.log({err: err});
                                reply(err);
                            }
                        });
                        log.log({
                            _id: orderNum,
                            subtotal: subtotal,
                            shippingCosts: shippingCosts,
                            total: total
                        });
                        //REPLYING WITH THE INFO FOR THE SUBMITTING THE ORDER
                        reply({
                            _id: orderNum,
                            subtotal: subtotal,
                            shippingCosts: shippingCosts,
                            total: total
                        });
                    }
                });
        });
    }
};


//ROUTE FOR SUBMITTING FINALIZED SALES
exports.postSale = {
    validate: {
        payload: {
            customerName: Joi.string(),
            _id: Joi.number().min(0).required(),
            product: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            quantity: Joi.alternatives().try(Joi.number().min(1), Joi.array().includes(Joi.number().min(1))).required(),
            farmerId: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            transportation: Joi.string(),
            delivery: Joi.number().required(),
            notes: Joi.string(),
            total: Joi.number().required(),
            subtotal: Joi.number()
        }
    },
    handler: function (req, reply) {
        log.log({METHOD: "Recieved POST"});
        //log.log({req: req});
        //NORMAILZING INPUT
        var cleanedInitials = myUtils.lowerAndTrim(req.payload.farmerId);
        var cleanedProducts = myUtils.lowerAndTrim(req.payload.product);
        var cleanedQuantities = req.payload.quantity;

        cleanedProducts = myUtils.arrayify(cleanedProducts);
        cleanedInitials = myUtils.arrayify(cleanedInitials);
        cleanedQuantities = myUtils.arrayify(cleanedQuantities);

        //Decrementing item quantity
        cleanedProducts.forEach(function (product, index) {
            Item.findOne({
                "product": product,
                "farmerId": cleanedInitials[index]
            }).lean()
                .select("product price farmer quantity inStock")
                .sort("-date")
                .limit(1)
                .exec(function (err, item) {

                    var thisQuantity;

                    if (err) {
                        reply(err);
                    } else {

                        thisQuantity = -1 * cleanedQuantities[index];
                        log.log({"Item before": item});
                        console.log("subtotal", req.payload.subtotal);
                        //decreasing quantity by 1
                        Item.findByIdAndUpdate(item._id,
                            {$inc : {quantity: thisQuantity}, $set: {inStock: (item.quantity + thisQuantity > 0)}},
                            function (err, doc) {
                                if (err) {
                                    log.log({err: err});
                                }
                                log.log({"Item after": doc});
                            }
                            );

                      //UPDATING THE SALE WITH FINALIZED DATA
                        Sale.findByIdAndUpdate(
                            req.payload._id,
                            {
                                farmerId: cleanedInitials,
                                products: cleanedProducts,
                                quantities: req.payload.quantity,
                                notes: req.payload.notes,
                                shipping: !!req.payload.transportation,
                                delivery: req.payload.delivery,
                                total: req.payload.total,
                                subtotal: req.payload.subtotal
                            },
                            function (err, doc) {
                                if (err) {
                                    reply(err);
                                }

                                log.log({"CONFIRMED SALE": doc});
                                reply({"logStatus" : "success"});
                            }
                        );
                    }
                });
        });
    }
};