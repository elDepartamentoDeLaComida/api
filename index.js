"use strict";
var loggly = require("loggly"),
    Config = require("./config/server.config");
var log = loggly.createClient(Config.logger);
var Hapi = require("hapi"),
    Routes = require("./routes"),
    db = require("./database").db;
//require("stackup");

//LEAVE CORS TRUE TO ALLOW LOCALHOST TESTING
//LEAVE ABORT EARLY TRUE FOR DEBUG
var port = process.env.PORT || Config.server.port;
var server = new Hapi.Server(port);

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