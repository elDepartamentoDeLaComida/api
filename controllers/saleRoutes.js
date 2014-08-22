//ROUTES
//SALES
var loggly = require("loggly"),
    Config = require("../server.config");
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
            productName: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            quantity: Joi.alternatives().try(Joi.number().min(1), Joi.array().includes(Joi.number().min(1))).required(),
            notes: Joi.string(),
            shipping: Joi.string(),
            delivery: Joi.number().required(),
            farmerInitials: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
        }
    },
    handler: function (req, reply) {
        log.log({METHOD: "RECIEVED GET"});
        //log.log({req: req});
        //NORMALIZING INPUT
        var cleanedProducts = myUtils.lowerAndTrim(req.query.productName);
        var cleanedInitials = myUtils.lowerAndTrim(req.query.farmerInitials);

        //CALCULATING TOTAL AND ORDER_ID
        var total = 0,
            orderNum = 0;

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
                "farmerInitials": cleanedInitials[index]
            }).lean()
                .select("product price farmer inStock")
                .sort("-date")
                .limit(1)
                .exec(function (err, item) {

                    var thisQuantity;
                    if (err) {
                        reply(err);
                        return;
                    }
                    //IF PRODUCT IS NOT FOUND
                    if (!item || item === null) {
                        var error = Hapi.error.notFound("Product: " + product + " from " +  cleanedInitials[index] + " not found");
                        reply(error);
                        return;
                    }

                    if (item.inStock === false) {
                        reply({logStatus: item.product + " not in stock"});
                        return;
                    }

                    if (cleanedProducts.length === 1) {
                        thisQuantity = req.query.quantity;
                    } else {
                        thisQuantity = req.query.quantity[index];
                    }

                    //CALCULATING THE TOTAL
                    total += item.price * thisQuantity;

                    //IF IT'S THE LAST ITEM TO CALCULATE, SAVE THE THE STARTED SALE TO DB
                    if (index + 1 === cleanedProducts.length) {
                        if (!!req.query.shipping) {
                            total += (total * 0.1) + (req.query.delivery || 0);
                        }
                        total = parseFloat(total.toFixed(2));
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
                        log.log({_id: orderNum, total: total});
                        //REPLYING WITH THE INFO FOR THE SUBMITTING THE ORDER
                        reply({_id: orderNum, total: total});
                    }
                });
        });
    }
};


//ROUTE FOR SUBMITTING FINALIZED SALES
exports.postSale = {
    validate: {
        payload: {
            _id: Joi.number().min(0).required(),
            productName: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            quantity: Joi.alternatives().try(Joi.number().min(1), Joi.array().includes(Joi.number().min(1))).required(),
            farmerInitials: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
            shipping: Joi.string(),
            delivery: Joi.number().required(),
            notes: Joi.string(),
            total: Joi.number().required()
        }
    },
    handler: function (req, reply) {
        log.log({METHOD: "Recieved POST"});
        //log.log({req: req});
        //NORMAILZING INPUT
        var cleanedInitials = myUtils.lowerAndTrim(req.payload.farmerInitials);
        var cleanedProducts = myUtils.lowerAndTrim(req.payload.productName);
        var cleanedQuantities = req.payload.quantity;

        cleanedProducts = myUtils.arrayify(cleanedProducts);
        cleanedInitials = myUtils.arrayify(cleanedInitials);
        cleanedQuantities = myUtils.arrayify(cleanedQuantities);

        //Decrementing item quantity
        cleanedProducts.forEach(function (product, index) {
            Item.findOne({
                "product": product,
                "farmerInitials": cleanedInitials[index]
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
                                farmerInitials: cleanedInitials,
                                products: cleanedProducts,
                                quantities: req.payload.quantity,
                                notes: req.payload.notes,
                                shipping: !!req.payload.shipping,
                                delivery: req.payload.delivery
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