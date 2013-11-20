var jive = require('../'),
    assert = require('assert'),
    testUtil = require('../test-util'),
    testRunner = require('../node-test-runner'),
    q = require('q');

var integrationConfig = jive.service.options;

var host = integrationConfig['clientUrl'];
var port = integrationConfig['port'];
var base = host + ":" + port;
var jiveIdServerProc = null;
var fakeApiGatewayProc = null;

//Data for fake Jive ID server
var jiveIdPort = port + 1;
var jiveIdBase = host + ":" + jiveIdPort;

var jiveIdServerConfig = {
    clientUrl: host,
    port: jiveIdPort,
    serverType: 'jiveIdServer',
    serverName: 'Fake Jive ID Server',
    tokenResponses: {

    }
}

var setEnvironmentConfig = {
    "type": "setEnv",
    "env": {
        'jive_jiveid_servers_public': jiveIdBase,
        'jive.logging.level': 'DEBUG'
    }
}

var addTaskConfig = {
    "type": "addTask"
};

//Data for fake Jive Server
var fakeApiGatewayPort = port + 2;
var fakeApiGatewayUrl = host + ":" + fakeApiGatewayPort;

var fakeApiGatewayConfig = {
    clientUrl: host,
    port: fakeApiGatewayPort,
    serverType: 'fakeApiGateway',
    serverName: 'Fake Jive Instance Server'
}

var dataPath = "/api/jivelinks/v1/tiles/1234/data";
var dataUrl = fakeApiGatewayConfig['clientUrl'] + ":" + fakeApiGatewayConfig['port'] + dataPath;

var dataPushEndpoint = {
    "type": "setEndpoint",
    "method": "PUT",
    "path": dataPath,
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
describe('Registration Tests', function () {

    //Configure mock Jive ID server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(jiveIdServerConfig)
            .then(function (serverProc) {
                jiveIdServerProc = serverProc;
            })
            .thenResolve(testUtil.createServer(fakeApiGatewayConfig))
            .then(function (serverProc) {
                fakeApiGatewayProc = serverProc;
                return testUtil.sendOperation(dataPushEndpoint, serverProc);
            })
            .then(function () {
                done();
            });
    });

    beforeEach(function (done) {
        testUtil.clearInstances(testRunner.serverProcess()).then(function () {
            return testUtil.sendOperation(setEnvironmentConfig, testRunner.serverProcess());
        }).then(function () {
                done();
            });
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeApiGatewayProc))
            .then(done);
    });

    it("Registration Tests - register tile and verify it is found with jive.tiles.findByID()", function (done) {

        var tileId;

        testUtil.registerTile(integrationConfig, 'samplelist', dataUrl)
            .then(function (id) {
                tileId = id;
                return testUtil.findTile(testRunner.serverProcess(), tileId);
            })
            .then(function (tile) {
                if (tile) {
                    console.log('Found tile %s', JSON.stringify(tile));
                }
                else {
                    assert.fail(tile, true, 'Expected tile to exist for ID ' + tileId);
                }
            })
            .then(function () {
                done();
            });

    });

    it("Registration Tests - verify 502 is returned when Jive ID cannot be reached", function (done) {

        var envInvalidJiveId = {
            "type": "setEnv",
            "env": {
                'jive_jiveid_servers_public': 'http://localhost:' + (port + 20)
            }
        };

        testUtil.sendOperation(envInvalidJiveId, testRunner.serverProcess()).then(function () {
            return testUtil.post(base + "/registration", 502, null, registrationRequest, {"Authorization": basicAuth}, true);
        }).then(function () {
                done();
            });

    });
});

