var jive = require('../../../jive-sdk'),
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
    "env" : {
        'jive_jiveid_servers_public' : jiveIdBase,
        'jive.logging.level': 'DEBUG'
    }
}

//Data for fake Jive Server
var fakeJivePort = port + 2;
var fakeJiveUrl = host + ":" + fakeJivePort;

var fakeJiveServerConfig = {
    clientUrl: host,
    port: fakeJivePort,
    serverType: 'fakeJiveServer',
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
    "name": "sampletable",
    "config": {"config":"value"},
    "url": fakeJiveUrl + dataPushEndpoint.path,
    "guid": testUtil.makeGuid(fakeJiveUrl,true,1234)
}


//************************MOCHA TESTS************************
describe('jive.util', function () {

    //Configure mock Jive ID server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(jiveIdServerConfig)
            .then(function (serverProc) {
                jiveIdServerProc = serverProc;
                return testUtil.sendOperation(setEnvironmentConfig, testRunner.serverProcess())
            })
            .thenResolve(testUtil.createServer(fakeJiveServerConfig, {silent: true}))
            .then(function(serverProc) {
                fakeJiveServerProc = serverProc;
                return testUtil.sendOperation(dataPushEndpoint, serverProc);
            })
            .then(function(){
                done();
            });
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeJiveServerProc))
            .then(done);
    });

    describe('#registration()', function () {
        it("GET to /registration should return 404", function (done) {
            testUtil.get(base + "/registration", 404).then(function (res) {
                done();
            });
        });

        it("POST to /registration without basic auth should return 401", function (done) {
            testUtil.post(base + "/registration", 401, null, {}).then(function (res) {
                done();
            });
        });

        it("POST to /registration with basic auth and no entity should return 400", function (done) {
            testUtil.post(base + "/registration", 400, null, {}, {"Authorization" : basicAuth}).then(function (res) {
                done();
            });
        });

        it("POST to /registration with incorrect basic auth should return 403", function (done) {
            testUtil.post(base + "/registration", 403, null, {}, {"Authorization" : "Basic blahblah"}, true).then(function (res) {
                done();
            });
        });

        it("POST to /registration with basic auth and correct JSON should return 201 (created)", function (done) {
            testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization" : basicAuth}, true).then(function (res) {
                done();
            });
        });
    });

});


