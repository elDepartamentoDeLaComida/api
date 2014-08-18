var Lab = require("lab"),
  serializeJSON = require("../utils/myUtils").serializeJSON,
  server = require('../index').server;

Lab.experiment("Users:", function () {
  Lab.test("User can be registered",
  function (done) {
      var options = {
          method: "POST",
          url: "/users",
          payload: {
              username: "testuser",
              name: "Tester test",
              password: "helloTest",
              scope: 0
          }
      };

      server.inject(options, function (res) {
          var result = res.result,
            payload = options.payload;
        Lab.expect(res.statusCode).to.equal(200);
        Lab.expect(result._id).to.equal(payload.username);
        Lab.expect(result.name).to.equal(payload.name);
        Lab.expect(result.scope).to.equal(payload.scope);

        done();
      });
  });
  Lab.test("Users cannot be repeatedly inserted/they are actually created",
  function (done) {
      var assertions = {
          message: "User: testuser already exists"
      },
        options = {
            method: "POST",
            url: "/users",
            payload: {
                username: "testuser",
                name: "Tester test",
                password: "helloTest",
                scope: 0
            }
        };
      server.inject(options, function (res) {
         var result = res.result;
         Lab.expect(res.statusCode).to.equal(409);
         Lab.expect(result.message).to.equal(assertions.message);

         done();
      });
  });

  Lab.test("When username is provided, get returns one user", function (done) {
     var assertions = {
         username: "testuser"
     },
     options = {
         method: "GET",
         url: "/users/" + assertions.username
     };
     server.inject(options, function (res) {
        var result = res.result;
        Lab.expect(res.statusCode).to.equal(200);
        Lab.expect(result).to.be.instanceof(Array);
        Lab.expect(result.length).to.equal(1);

        done();
     });
  });

  Lab.test("When username is not provided, get returns all users", function (done) {
     var options = {
         method: "GET",
         url: "/users"
    };
     server.inject(options, function (res) {
        var result = res.result;
        Lab.expect(res.statusCode).to.equal(200);
        Lab.expect(result).to.be.instanceof(Array);

        done();
     });
  });
  
  Lab.test("User can be deleted", function (done) {
      var assertions = {
          username: "testuser"
      },
      options = {
          method: "DELETE",
          url: "/users/" + assertions.username
      };
      server.inject(options, function (res) {
         var result = res.result;

         Lab.expect(res.statusCode).to.equal(200);
         Lab.expect(result._id).to.equal(assertions.username);

         done();
      });
  });
});
