var loggly = require("loggly"),
    Config = require("../server.config");

exports.handler = {
    handler: {
        directory: {
            path: "./internal",
            index: true
        }
    }
};