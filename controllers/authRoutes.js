//ROUTES
//AUTHENTICATION
var bunyan = require("bunyan"),
  Config = require("../server.config");
var log = bunyan.createLogger({
    name: Config.logger.name,
    serializers: bunyan.stdSerializers,
    streams: Config.logger.streams
  });
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
    log.info({METHOD: "POST AUTHENTICATION"});
    User.getAuthenticated(req.payload.username, req.payload.password, function (err, user, reason) {
        log.info(user);
      if (err) {
        console.error({err: err});
        return reply(err);
      }
      if (user) {
        log.info({"User logged in": user});
        req.auth.session.set(user);
        return reply(user);
      }
      console.log("turn back!");
      var reasons = User.failedLogin;
      switch (reason) {
      case reasons.NOT_FOUND:
      case reasons.PASSWORD_INCORRECT:
        return reply(Hapi.error.badRequest("User/password pair incorrect"));
        break;
      case reasons.MAX_ATTEMPTS:
        return reply(Hapi.error.unauthorized("Too many attempts, try later"));
        break;
      }
    });
  }
};

exports.login = {
  handler: function (req, reply) {
    if (req.auth.isAuthenticated) {
      return reply({redirect: Config.app.pages + "/adminMenu.html"});
    }
    return reply({redirect: Config.app.pages + "/index.html"});
  }
};

exports.logout = {
    handler: function (req, reply) {
        req.auth.session.clear();
        return reply.redirect('/');
    }
}
