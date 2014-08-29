//ROUTES
//AUTHENTICATION
var loggly = require("loggly"),
    Config = require("../config/server.config");
var log = loggly.createClient(Config.logger);
var Joi = require("joi"),
    Hapi = require("hapi"),
    User = require("../logic/user-logic").User,
    path = require("path"),
    myutils = require("../utils/myUtils");

exports.authenticate = {
    validate: {
        payload: {
            username: Joi.string().required(),
            password: Joi.string().required()
        },
    },
    auth: {
        mode: "try",
        strategy: "session"
    },
    plugins: {
        "hapi-auth-cookie": {
            redirectTo: false
        }
    },
    handler: function (req, reply) {
        log.log({METHOD: "POST AUTHENTICATION"});
        User.getAuthenticated(req.payload.username, req.payload.password,
            function (err, user, reason) {
                log.log(user);
                if (err) {
                    console.error({err: err});
                    return reply(err);
                }
                if (user) {
                    log.log({"User logged in": user});
                    req.auth.session.set(user);
                    return reply(user);
                }
                console.log("turn back!");
                var reasons = User.failedLogin;
                switch (reason) {
                case reasons.NOT_FOUND:
                case reasons.PASSWORD_INCORRECT:
                    reply(Hapi.error.badRequest("User/password pair incorrect"));
                    break;
                case reasons.MAX_ATTEMPTS:
                    reply(Hapi.error.unauthorized("Too many attempts, try later"));
                    break;
                }
            });
    }
};


exports.logout = {
    handler: function (req, reply) {
        req.auth.session.clear();
        return reply.redirect('/');
    }
};
