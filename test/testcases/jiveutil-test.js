var jive = require('../../../jive-sdk'),
    assert = require('assert'),
    testUtil = require('../test-util');

var host = jive.service.options['clientUrl'];
var port = jive.service.options['port'];
var base = host + ":" + port;

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

//************************MOCHA TESTS************************

describe('jive.util', function () {


    //Configure server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.configServer(getEndpoint)
            .thenResolve(testUtil.configServer(postEndpoint))
            .then(done);
    });

    describe('#buildRequest()', function () {
        it("GET to /test", function (done) {
            testUtil.get(base + getEndpoint.path, 200, null).then(function(res) {
                done();
            });
        });

        it("POST to /test", function (done) {
           testUtil.post(base + postEndpoint.path, postEndpoint.statusCode, null, null).then(function(res) {
               done();
           });
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