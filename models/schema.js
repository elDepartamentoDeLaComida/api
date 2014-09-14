var mongoose = require("../database").mongoose,
    Schema = mongoose.Schema;

//SCHEMA
var orderSchema = new Schema({
    farmer: String,
    farmerId: String,
    date: {type: Date, default: Date.now},
    products: Array,
    quantities: Array,
    unit: Array,
    transportation: Boolean,
    transportationCosts: Number,
    prices: Array,
    notes: String,
    total: Number
});
exports.Order = mongoose.model('Order', orderSchema);

var saleSchema = new Schema({
    _id: Number,
    farmerId: Array,
    date: {type: Date, default: Date.now},
    products: Array,
    quantities: Array,
    shipping: Boolean,
    delivery: Number,
    notes: String,
    total: Number,
    subtotal: Number
});
exports.Sale = mongoose.model('Sale', saleSchema);

var itemSchema = new Schema({
    product: String,
    price: Number,
    farmer: String,
    farmerId: String,
    quantity: Number,
    date: {type: Date, default: Date.now},
    inStock: {type: Boolean, default: true}
});
exports.Item = mongoose.model('Item', itemSchema);