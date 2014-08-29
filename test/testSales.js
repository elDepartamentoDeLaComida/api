var Lab = require("lab"),
    serializeJSON = require("../utils/myUtils").serializeJSON,
    server = require('../index').server;

Lab.experiment("Sales:", function () {

    var order = {};
    Lab.test("get endpoint can calculate sale",
        function (done) {
            var assertions = {
                total: 11.5
            };
            var query = {
                productName: ["oregano", "tomillo"],
                quantity: [1, 1],
                farmerInitials: ["t1", "t1"],
                transportation: "true",
                delivery: 5
            };
            var options = {
                method: "GET",
                url: "/api/sales?" + serializeJSON(query)
            };

            server.inject(options, function (response) {
                var result = response.result;
                //console.error(response);

                Lab.expect(response.statusCode).to.equal(200);
                Lab.expect(result.total).to.equal(assertions.total);
                order = result;
                done();
            });
        });

    Lab.test("items that don't exist, return 404 upon total calculation",
        function (done) {
            var query = {
                productName: ["magicdust", "hornytoad"],
                quantity: [1, 1],
                farmerInitials: ["t2", "t5"],
                transportation: "true",
                delivery: 5
            };
            var options = {
                method: "GET",
                url: "/api/sales?" + serializeJSON(query)
            };

            server.inject(options, function (response) {
                //console.log(response);

                Lab.expect(response.statusCode).to.equal(404);
                done();
            });
        });

    Lab.test("calculated sale can be finalized and saved to DB",
        function (done) {
            var assertions = {
                logStatus: "success"
            };
            var options = {
                method: "POST",
                url: "/api/sales",
                payload: {
                    _id: order._id,
                    transportation: "true",
                    delivery: 5,
                    total: order.total,
                    productName: ["oregano", "tomillo"],
                    quantity: [1, 1],
                    farmerInitials: ["t1", "t1"],
                    notes: "Nothing to report"
                }
            };

            server.inject(options, function (response) {
                var result = response.result;

                Lab.expect(response.statusCode).to.equal(200);
                Lab.expect(result).to.be.instanceof(Object);
                Lab.expect(result.logStatus).to.equal(assertions.logStatus);
                done();
            });
        });
});
