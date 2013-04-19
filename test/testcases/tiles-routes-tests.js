var jive = require('../../../jive-sdk'),
    assert = require('assert'),
    test_util = require('../test-util');

var host = jive.service.options['clientUrl'];
var port = jive.service.options['port'];
var base = host + ":" + port;

var config = jive.service.options;
var clientId = config.clientId;
var clientSecret = config.clientSecret;

var getEndpoint = {
    "type": "setEndpoint",
    "method": "GET",
    "path": "/test",
    "statusCode": 200,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

var postEndpoint = {
    "type": "setEndpoint",
    "method": "POST",
    "path": "/test",
    "statusCode": 204,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

var successCallback = function (endpoint, done) {

    var expectedEntity = JSON.parse(endpoint.body);
    return function (res) {
        var entity = res.entity;
        if (res.statusCode != endpoint.statusCode) {
            assert.fail(res.statusCode, endpoint.statusCode, "Status code from server incorrect");
        }
        for (var key in entity) {
            if (entity[key] != expectedEntity[key]) {
                assert.fail(entity[key], expectedEntity[key], "Response from server was incorrect")
            }
        }
        done();
    };
};

var errorCallback = function (err) {
    console.log(err);
    assert.ifError(err);
};

//************************RUN TESTS AFTER CONFIGURATION OF SERVER COMPLETES************************

var url = base + "/test";
describe('jive.util', function () {


    //Configure server first. Call done() on completion for mocha to be happy
    before(function (done) {
        test_util.configServer(getEndpoint)
            .thenResolve(test_util.configServer(postEndpoint))
            .then(done);
    });


    describe('#buildRequest()', function () {
        it("GET to /test", function (done) {
            jive.util.buildRequest(base + getEndpoint.path, "GET")
                .execute(successCallback(getEndpoint,done), wrap(errorCallback, done));
        });

        it("POST to /test", function (done) {
            jive.util.buildRequest(base + postEndpoint.path, "POST", {test: "value"})
                .execute(successCallback(postEndpoint,done), wrap(errorCallback, done));
        });
    });
});


//*********************************************Helpers*********************************************
//For Mocha framework, need to call "done" after a callback to indicate the test completed for asynchronous tests
function wrap(f, done) {
    return function (arg) {
        f(arg);
        done();
    }
}

