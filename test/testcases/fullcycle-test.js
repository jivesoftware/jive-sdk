var jive = require('../../../jive-sdk'),
    assert = require('assert'),
    testUtil = require('../test-util'),
    testRunner = require('../node-test-runner'),
    q = require('q');

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
            .then(function () {
                done();
            });
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeJiveServerProc))
            .then(done);
    });

    describe("All Full Cycle Tests", function () {

        it("Full cycle registration - register and push data", function (done) {
            var taskKey = null;

            testUtil.configServer(addTaskConfig, testRunner.serverProcess()).then(function (m) {
                taskKey = m['task'];
                var promise = testUtil.waitForMessage(testRunner.serverProcess(), 'pushedData');
                testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true);
                return promise;

            }).then(function (res) {
                    if (res.statusCode != 204) {
                        assert.fail(res.statusCode, 204, "Expected datapush to be successful, return 204");
                    }

                    return testUtil.configServer({"type": "removeTask", "task": taskKey}, testRunner.serverProcess());
                })
                .then(function () {
                    done();
                });
        });

        it("Full cycle registration - access token exchange", function (done) {

            var dataPushFailEndpoint = {
                "type": "setEndpoint",
                "method": "PUT",
                "path": "/api/jivelinks/v1/tiles/1234/data",
                "statusCode": 401,
                "body": "",
                "headers": { "Content-Type": "application/json" }
            };

            var taskKey = null;

            testUtil.configServer(dataPushFailEndpoint, fakeJiveServerProc)
                .then(function () {
                    return testUtil.configServer(addTaskConfig, testRunner.serverProcess());
                })
                .then(function (m) {
                    taskKey = m['task'];
                    var promise = testUtil.waitForMessageValue(jiveIdServerProc, 'oauth2TokenRequest', {'grant_type': 'refresh_token'});
                    testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true);
                    return promise;
                })
                .then(function () {
                    return testUtil.configServer(dataPushEndpoint, fakeJiveServerProc);   //Configure the endpoint back to return 204 on data push
                })
                .then(function () {
                    return testUtil.waitForMessage(testRunner.serverProcess(), 'pushedData');
                })
                .then(function (res) {
                    if (res.statusCode != 204) {
                        assert.fail(res.statusCode, 204, "Expected datapush to be successful, return 204");
                    }
                    return testUtil.configServer({"type": "removeTask", "task": taskKey}, testRunner.serverProcess())
                })
                .then(function () {
                    done();
                });

        });
    });
});


