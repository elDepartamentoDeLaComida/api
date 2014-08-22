var mongoose = require("mongoose"),
    ConfigDB = require("./db.config").mongoLocal;

//SETUP
mongoose.connect("mongodb://" + ConfigDB.url + "/" + ConfigDB.database);
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to DB:", ConfigDB);
});

exports.mongoose = mongoose;
exports.db = db;