//ROUTES
//AUTHENTICATION
var loggly = require("loggly"),
    Config = require("../server.config");
var log = loggly.createClient(Config.logger);
var Hapi = require("hapi"),
    Joi = require("joi"),
    User = require("../logic/user-logic").User,
    path = require("path"),
    myUtils = require("../utils/myUtils");

exports.register = {
    validate: {
        payload: {
            username: Joi.string().required(),
            password: Joi.string().required(),
            scope: Joi.number().required(),
            name: Joi.string().required()
        }
    },
    handler: function (req, reply) {
        var id = myUtils.lowerAndTrim(req.payload.username);
        User.findById(id).lean().exec(function (err, user) {
            if (err) {
                return reply(err);
            }
            if (!user || user === null) {
                var newUser = new User({
                    _id: id,
                    scope: req.payload.scope,
                    password: req.payload.password,
                    name: req.payload.name
                });
                newUser.save(function (err, doc) {
                    if (err) {
                        return reply(err);
                    }

                    log.log("new user:", doc);
                    return reply(doc);
                });
            } else {
                var error = Hapi.error.conflict("User: " + user._id + " already exists");
                return reply(error);
            }
        });
    }
};

exports.delete = {
    validate: {
        params: {
            username: Joi.string().required()
        }
    },
    handler: function (req, reply) {
        var id = myUtils.lowerAndTrim(req.params.username);
        User.findByIdAndRemove(id).exec(function (err, user) {
            if (err) {
                return reply(err);
            }
            log.log("Deleted", user);
            return reply(user);
        });
    }
};

exports.get = {
    validate: {
        params: {
            username: Joi.string()
        }
    },
    handler: function (req, reply) {
        var id = req.params.username,
            query = (req.params.username ? {_id: myUtils.lowerAndTrim(id)} : {});
        console.log("Query", query);
        User.find(query).exec(function (err, users) {
            if (err) {
                return reply(err);
            }
            if (!users || users === false) {
                return reply(Hapi.error.notFound("User not found"));
            }
            log.log("Requested User-list");
            return reply(users);
        });
    }
};
