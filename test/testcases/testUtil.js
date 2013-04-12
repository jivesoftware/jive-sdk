var util = require('../../lib/util'),
    jive = require('../../api'),
    assert = require('assert');

var host = jive.config.fetch()['baseUrl'];
var port = jive.config.fetch()['port'];
var base = host + ":" + port;


var successCallback = function(res) {
    console.log("Request succeeded:");
    console.log(res.substring(0, 100));
};

var errorCallback = function(err) {
    console.log(err);
    assert.ifError(err);
};

describe('util', function(){
    it("should succeed with GET to '" + base + "'", function(done) {
        console.log("Starting request");
        util.buildRequest(base, "GET")
            .execute(function(res) {successCallback(res); done();}, function(err) {errorCallback(err); done();});
    });
});