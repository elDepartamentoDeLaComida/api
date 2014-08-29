var loggly = require("loggly"),
    Config = require("../config/server.config");
var Hapi = require("hapi"),
    path = require("path");

exports.handler = {
    handler: {
        directory: {
            path: "./public",
            index: true
        }
    }
};