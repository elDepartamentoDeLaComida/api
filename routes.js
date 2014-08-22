var requireDir = require("require-dir");
var routes = requireDir("./controllers");

exports.endpoints = [
    {method: "GET", path: "/api/orders", config: routes.orderRoutes.getOrders},
    {method: "POST", path: "/api/orders", config: routes.orderRoutes.postOrders},

    {method: "GET", path: "/api/sales", config: routes.saleRoutes.getTotal},
    {method: "POST", path: "/api/sales", config: routes.saleRoutes.postSale},

    {method: "POST", path: "/auth/login", config: routes.authRoutes.authenticate},
    {method: "GET", path: "/auth/logout", config: routes.authRoutes.logout},

    {method: "DELETE", path: "/users/{username}", config: routes.userRoutes.delete},
    {method: "GET", path: "/users/{username?}", config: routes.userRoutes.get},
    {method: "POST", path: "/users", config: routes.userRoutes.register},

    {method: "GET", path: "/internal/{path*}", config: routes.internalRouter.handler},
    {method: "GET", path: "/{publicPath*}", config: routes.publicRouter.handler}
];
