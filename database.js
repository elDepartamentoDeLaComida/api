var mongoose = require("mongoose"),
    ConfigDB;
if (process.env.PORT) {
    console.log("using external");
    ConfigDB = require("./config/db.config").mongo;
} else {
    ConfigDB = require("./config/db.config").mongoLocal;
}

//SETUP
mongoose.connect("mongodb://" + ConfigDB.dbuser + ":" + ConfigDB.password + "@" + ConfigDB.url + "/" + ConfigDB.database);
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to DB:", ConfigDB);
});

exports.mongoose = mongoose;
exports.db = db;