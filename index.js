"use strict";
var bunyan = require("bunyan"),
  Config = require("./server.config");
var log = bunyan.createLogger({
    name: Config.logger.name,
    serializers: bunyan.stdSerializers,
    streams: Config.logger.streams
  });
var Hapi = require("hapi"),
  Routes = require("./routes"),
  db = require("./database").db;
//require("stackup");

//LEAVE CORS TRUE TO ALLOW LOCALHOST TESTING
//LEAVE ABORT EARLY TRUE FOR DEBUG
var server = new Hapi.Server(Config.server.port, Config.server.hostname, Config.options);

//START
server.pack.register([require('lout'), require("hapi-auth-cookie")], function (err) {
  if (err) {
    throw err;
  }

  server.auth.strategy('session', 'cookie', {
    password: "localOrDie",
    cookie: "elDept",
    redirectTo: false,
    isSecure: false,
    ttl: 24 * 60 * 60 * 1000 //1 day session
  });

  server.ext("onRequest", function (request, next) {
    console.log(request.path, request.query);
    next();
  });

  server.route(Routes.endpoints);

  if (!module.parent) {
    server.start(function () {
      console.log('Server started at: ' + server.info.uri);
    });
  }
  exports.server = server;
});