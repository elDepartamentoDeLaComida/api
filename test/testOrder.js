var Lab = require("lab"),
    serializeJSON = require("../utils/myUtils").serializeJSON,
    server = require('../index').server,
    creds = require("./test.config").credentials;

Lab.experiment("Orders:", function () {
    Lab.test("post endpoint recieves Order",
        function (done) {
            var assertions = {
                logStatus: "success"
            };
            var options = {
                method: "POST",
                url: "/api/orders",
                credentials: creds,
                payload: {
                    farmer: "test 1",
                    farmerId: "t1",
                    notes: "Nothing to report",
                    price: [0.5, 1],
                    quantity: [2, 1],
                    unit: ["oz", "oz"],
                    transportation: "true",
                    product: ["oregano", "tomillo"],
                }
            };

            server.inject(options, function (response) {
                //console.error(response);
                var result = response.result;

                Lab.expect(response.statusCode).to.equal(200);
                Lab.expect(result).to.be.instanceof(Object);
                Lab.expect(result.logStatus).to.equal(assertions.logStatus);

                done();
            });
        });
    Lab.test("get endpoint, with id, returns 1 order",
        function (done) {
            var assertions = {
                len: 1
            };
            var options = {
                method: "GET",
                url: "/api/orders/t1",
                credentials: creds
            };
            server.inject(options, function (response) {
                var result = response.result;
               // console.log(result);
                Lab.expect(response.statusCode).to.equal(200);
                Lab.expect(result.length).to.equal(assertions.len);
                done();
            });
        });
});
