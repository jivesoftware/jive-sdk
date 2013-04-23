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
var fakeJivePort = port + 2;
var fakeJiveUrl = host + ":" + fakeJivePort;

var fakeJiveServerConfig = {
    clientUrl: host,
    port: fakeJivePort,
    serverType: 'fakeJiveServer',
    serverName: 'Fake Jive Instance Server'
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
    "config": {"config": "value"},
    "url": fakeJiveUrl + dataPushEndpoint.path,
    "guid": testUtil.makeGuid(fakeJiveUrl, true, 1234)
}


//************************MOCHA TESTS************************
describe('Full Cycle Tests', function () {

    //Configure mock Jive ID server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(jiveIdServerConfig)
            .then(function (serverProc) {
                jiveIdServerProc = serverProc;
                return testUtil.configServer(setEnvironmentConfig, testRunner.serverProcess());
            })
            .thenResolve(testUtil.createServer(fakeJiveServerConfig))
            .then(function (serverProc) {
                fakeJiveServerProc = serverProc;
                return testUtil.configServer(dataPushEndpoint, serverProc);
            })
            .then(function (x) {
                done();
            });
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeJiveServerProc))
            .then(done);
    });


    it("Full cycle registration - register and push data", function (done) {

        testUtil.configServer(addTaskConfig, testRunner.serverProcess()).then(function (m) {

            var task = m['task'];
            var isDone = false;

            testRunner.serverProcess().on("message", function (m) {
                var pushedData = m['pushedData'];
                if (pushedData && !isDone) {
                    if (pushedData.statusCode != 204) {
                        assert.fail(pushedData.statusCode, 204, "Expected datapush to be successful, return 204");
                    } else {
                        isDone = true;
                        testUtil.configServer({"type": "removeTask", "task": task}, testRunner.serverProcess()).then(function () {
                            done();
                        });
                    }
                }
            });

            testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true);

        });

    });


    it("Full cycle registration - access token exchange", function (done) {


        var dataPushEndpoint = {
            "type": "setEndpoint",
            "method": "PUT",
            "path": "/api/jivelinks/v1/tiles/1234/data",
            "statusCode": 401,
            "body": "",
            "headers": { "Content-Type": "application/json" }
        };


        testUtil.configServer(dataPushEndpoint, fakeJiveServerProc)
            .thenResolve(testUtil.configServer(addTaskConfig, testRunner.serverProcess()))
            .then(function (m) {

                var task = m['task'];

                var isDone = false;

                testRunner.serverProcess().on("message", function (m) {
                    var pushedData = m['pushedData'];
                    if (pushedData && !isDone) {
                        if (pushedData.statusCode != 204) {
                            assert.fail(pushedData.statusCode, 204, "Expected datapush to be successful, return 204");
                        } else {
                            isDone = true;
                            testUtil.configServer({"type": "removeTask", "task": task}, testRunner.serverProcess()).then(function () {
                                done();
                            })
                        }
                    }
                });

                testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true);
            });
    });
});


