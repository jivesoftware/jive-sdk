var jive = require('../../../jive-sdk'),
    assert = require('assert'),
    testUtil = require('../test-util');

var integrationConfig = jive.service.options;

var host = integrationConfig['clientUrl'];
var port = integrationConfig['port'];
var base = host + ":" + port;
var jiveIdServerProc = null;


var postEndpoint = {
    "type": "setEndpoint",
    "method": "POST",
    "path": "/test",
    "statusCode": 204,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

var jiveIdPort = port + 1;
var jiveIdBase = host + ":" + jiveIdPort;

var jiveIdServerConfig = {
    clientUrl: host,
    port: jiveIdPort,
    mockJiveId: true
}


//************************MOCHA TESTS************************
describe('jive.util', function () {

    //Configure mock Jive ID server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(jiveIdServerConfig)
            .then(function (serverProc) {
                jiveIdServerProc = serverProc;
                return testUtil.configServer(postEndpoint, serverProc)
            })
            .then(done);
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .then(done);
    });


    describe('#buildRequest()', function () {
        it("GET to /registration", function (done) {
            testUtil.get(base + "/registration", 200).then(function (res) {
                done();
            });
        });

        it("POST to /test", function (done) {
            testUtil.post(jiveIdBase + postEndpoint.path, 204, null, null).then(function (res) {
                done();
            });
        });
    });
});


