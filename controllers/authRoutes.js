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
  path = require("path");

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
      console.error(err);
      console.error(user);
      console.error(reason);
      if (err) {
        console.error({err: err});
      }
      if (user) {
        log.info({"User logged in": user});
        req.auth.session.set(user);
        return reply({redirect: Config.app.pages + "/adminMenu.html", user: user});
      }
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

exports.login = {
  handler: function (req, reply) {
    if (req.auth.isAuthenticated) {
      return reply({redirect: Config.app.pages + "/adminMenu.html"});
    }
    return reply({redirect: Config.app.pages + "/index.html"});
  }
};

