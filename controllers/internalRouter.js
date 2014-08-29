var loggly = require("loggly"),
    Config = require("../config/server.config");

exports.handler = {
    handler: {
        directory: {
            path: "./internal",
            index: true
        }
    }
};