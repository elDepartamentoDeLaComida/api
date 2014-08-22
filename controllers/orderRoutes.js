//ROUTES
//ORDERS
var loggly = require("loggly"),
    Config = require("../server.config");
var log = loggly.createClient(Config.logger);

var myUtils = require("../utils/myUtils"),
  Joi = require("joi"),
  Order = require("../models/schema").Order,
  Item = require("../models/schema").Item;

//var Hapi = plugin.hapi;

//ROUTE FOR POSTING ORDERS TO THE DB
exports.postOrders = {
  auth: "session",
  validate: {
    payload: {
      farmer: Joi.string().required(),
      farmerInitials: Joi.string().required(),
      productName: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
      quantity: Joi.alternatives().try(Joi.number().min(1), Joi.array().includes(Joi.number().min(1))).required(),
      price: Joi.alternatives().try(Joi.number().min(0), Joi.array().includes(Joi.number().min(0))).required(),
      unit: Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string())).required(),
      shipping: Joi.string(),
      notes: Joi.string()
    }
  },
  handler: function (req, reply) {
    log.log({METHOD: "Recieved POST"});
    //NORMALIZING INPUT
    var cleanedFarmer = myUtils.lowerAndTrim(req.payload.farmer);
    var cleanedProducts = myUtils.lowerAndTrim(req.payload.productName);
    var cleanedInitials = myUtils.lowerAndTrim(req.payload.farmerInitials);

    //TURNING PRODUCTS INTO ARRAY FOR EASIER HANDLING
    cleanedProducts = myUtils.arrayify(cleanedProducts);

    //CALCULATING TOTAL
    var total = 0;
    if (cleanedProducts.length === 1) {
      //IF ONLY ONE ITEM THE PRICE OF THAT ITEM IS THE TOTAL
      total = req.payload.price;
    } else {
      total = cleanedProducts.reduce(function (prev, curr, index) {
        return prev + (req.payload.price[index] * req.payload.quantity[index]);
      }, total);
    }

    if (!!req.payload.shipping) {
      total += (total * 0.1).toFixed(2);
    }
    //CREATING NEW ORDER OBJECT
    var newOrder = new Order({
      farmer: cleanedFarmer,
      farmerInitials: cleanedInitials,
      products: cleanedProducts,
      quantities: req.payload.quantity,
      prices: req.payload.price,
      notes: req.payload.notes,
      unit: req.payload.unit,
      shipping: !!req.payload.shipping,
      total: total
    });

    //RETURNING AN ARRAY OF ITEM OBJECTS TO LATER SAVE
    var inventoryItems = cleanedProducts.map(function (item, index) {
      if (cleanedProducts.length === 1) {
        return new Item({
          product: item,
          price: req.payload.price,
          farmerInitials: cleanedInitials,
          quantity: req.payload.quantity,
          unit: req.payload.unit,
          farmer: cleanedFarmer
        });
      }
      //IF MORE THAN ONE PRODUCT, MATCHES THE PRODUCT TO ITS RESPECTIVE QUANTITY
      //AND PRICE
      return new Item({
        product: item,
        farmerInitials: cleanedInitials,
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
      log.log({"Order Saved": order});
      reply({"logStatus" : "success"});
    });
  }
};

//TODO
//ROUTE FOR GETTING ORDERS FROM DB
exports.getOrders = {
  auth: "session",
  handler: function (req, reply) {
    log.log("RECIEVED GET");
    //log.log({req: req});
    reply("CAN'T PROCESS YET, but thanks for trying");
  }
};
