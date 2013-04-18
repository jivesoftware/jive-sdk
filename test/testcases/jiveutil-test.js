var jive = require('../../../jive-sdk'),
    assert = require('assert'),
    test_util = require('../test-util');

var host = jive.service.options['clientUrl'];
var port = jive.service.options['port'];
var base = host + ":" + port;

var configJSON = {
    "type": "setEndpoint",
    "method": "GET",
    "path": "/test",
    "statusCode": 200,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }

};

var successCallback = function (res) {
    var entity = res.entity;
    if (res.statusCode != 200) {
        assert.fail(res.statusCode, 200, "Status code from server incorrect");
    }
    else if (entity.key != "value") {
        assert.fail(res.key, "value", "Response from server was incorrect")
    }
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
        test_util.configServer(configJSON).then(function() { done()});
    });


    describe('#buildRequest()', function () {
        it("GET to /test", function (done) {
            jive.util.buildRequest(url, "GET")
                .execute(wrap(successCallback, done), wrap(errorCallback, done));
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