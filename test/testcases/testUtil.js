var jive = require('../../../jive-sdk'),
    assert = require('assert');

var host = jive.setup.options['clientUrl'];
var port = jive.setup.options['port'];
var base = host + ":" + port;


var successCallback = function(res) {
    console.log("Request succeeded:");
    console.log(JSON.stringify(res).substring(0, 100));
};

var errorCallback = function(err) {
    console.log(err);
    assert.ifError(err);
};

describe('jive.util', function(){
    describe('#buildRequest()', function() {
        it("should succeed with GET to '" + base + "'", function(done) {
            console.log("Starting request");
            jive.util.buildRequest(base, "GET")
                .execute(wrap(successCallback, done), wrap(errorCallback, done));
        });
    });
});

//Helpers

//For Mocha framework, need to call "done" after a callback to indicate the test completed for asynchronous tests
function wrap(f, done) {
    return function(arg) {
        f(arg);
        done();
    }
}