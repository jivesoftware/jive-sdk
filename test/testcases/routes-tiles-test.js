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

var basicAuth = testUtil.makeBasicAuth(integrationConfig.clientId, integrationConfig.clientSecret);


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
        it("GET to /registration should return 404", function (done) {
            testUtil.get(base + "/registration", 404).then(function (res) {
                done();
            });
        });

        it("POST to /registration without basic auth should return 401", function (done) {
            testUtil.post(base + "/registration", 401).then(function (res) {
                done();
            });
        });

        it("POST to /registration with basic auth and no entity should return 400", function (done) {
            testUtil.post(base + "/registration", 400, null, null, {"Authorization" : basicAuth}).then(function (res) {
                done();
            });
        });

        it("POST to /registration with incorrect basic auth should return 403", function (done) {
            testUtil.post(base + "/registration", 403, null, null, {"Authorization" : "Basic blahblah"}).then(function (res) {
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


