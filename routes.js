var orderRoutes = require("./controllers/orderRoutes"),
  saleRoutes = require("./controllers/saleRoutes"),
  authRoutes = require("./controllers/authRoutes");

exports.endpoints = [
  {method: "GET", path: "/api/orders", config: orderRoutes.getOrders},
  {method: "POST", path: "/api/orders", config: orderRoutes.postOrders},

  {method: "GET", path: "/api/sales", config: saleRoutes.getTotal},
  {method: "POST", path: "/api/sales", config: saleRoutes.postSale},

  {method: "POST", path: "/auth/login", config: authRoutes.authenticate},
  {method: "GET", path: "/", config: authRoutes.login}
];