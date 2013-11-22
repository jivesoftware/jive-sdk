var jive = require('.'),
    assert = require('assert'),
    testUtil = require('../test-util'),
    testRunner = require('../node-test-runner');

var integrationConfig = jive.service.options;

var host = integrationConfig['clientUrl'];
var port = integrationConfig['port'];
var base = host + ":" + port;
var jiveIdServerProc = null;
var fakeJiveServerProc = null;

//Data for fake Jive ID server
var jiveIdPort = port + 1;
var jiveIdBase = host + ":" + jiveIdPort;

var jiveIdServerConfig = {
    clientUrl: host,
    port: jiveIdPort,
    serverType: 'jiveIdServer',
    serverName: 'Fake Jive ID Server'
}

var setEnvironmentConfig = {
    "type": "setEnv",
    "env": {
        'jive_jiveid_servers_public': jiveIdBase,
        'jive.logging.level': 'DEBUG'
    }
}

//Data for fake Jive Server
var fakeApiGatewayPort = port + 2;
var fakeApiGatewayUrl = host + ":" + fakeApiGatewayPort;

var fakeApiGatewayConfig = {
    clientUrl: host,
    port: fakeApiGatewayPort,
    serverType: 'fakeApiGateway',
    serverName: 'Fake Jive Server'
}

var dataPushEndpoint = {
    "type": "setEndpoint",
    "method": "PUT",
    "path": "/api/jivelinks/v1/tiles/1234/data",
    "statusCode": 204,
    "body": "",
    "headers": { "Content-Type": "application/json" }
};

var basicAuth = testUtil.makeBasicAuth(integrationConfig.clientId, integrationConfig.clientSecret);

var registrationRequest =
{
    "code": integrationConfig.clientSecret,
    "name": "samplelist",
    "config": {"config": "value"},
    "url": fakeApiGatewayUrl + dataPushEndpoint.path,
    "guid": testUtil.makeGuid(fakeApiGatewayUrl, true, 1234)
}


//************************MOCHA TESTS************************
describe('Registration Authentication Tests', function () {

    //Configure mock Jive ID server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(jiveIdServerConfig)
            .then(function (serverProc) {
                jiveIdServerProc = serverProc;
                return testUtil.sendOperation(setEnvironmentConfig, testRunner.serverProcess())
            })
            .thenResolve(testUtil.createServer(fakeApiGatewayConfig, {silent: true}))
            .then(function (serverProc) {
                fakeJiveServerProc = serverProc;
                return testUtil.sendOperation(dataPushEndpoint, serverProc);
            })
            .then(function () {
                done();
            });
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeJiveServerProc))
            .then(done);
    });

    it("GET to /registration should return 404", function (done) {
        testUtil.get(base + "/registration", 404).then(function (res) {
            done();
        });
    });

    it("PUT to /registration should return 404", function (done) {
        testUtil.put(base + "/registration", 404).then(function (res) {
            done();
        });
    });

    it("DELETE to /registration should return 404", function (done) {
        testUtil.delete(base + "/registration", 404).then(function (res) {
            done();
        });
    });

    it("POST to /registration with basic auth and no entity should return 400", function (done) {
        testUtil.post(base + "/registration", 400, null, {}, {"Authorization": basicAuth}).then(function (res) {
            done();
        });
    });

    it("POST to /registration with incorrect basic auth should return 403", function (done) {
        testUtil.post(base + "/registration", 403, null, {}, {"Authorization": "Basic blahblah"}, true).then(function (res) {
            done();
        });
    });

    it("POST to /registration without basic auth should return 201", function (done) {
        testUtil.post(base + "/registration", 201, null, registrationRequest, {}, true).then(function (res) {
            done();
        });
    });

    it("POST to /registration with basic auth and correct JSON should return 201 (created)", function (done) {
        testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true).then(function (res) {
            done();
        });
    });

});


