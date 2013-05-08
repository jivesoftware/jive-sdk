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
        'jive_logging_level': 'DEBUG'
    }
}

var addTaskConfig = {
    "type": "addTask",
    "name": "sampleactivity",
    "tileOrActivity": "activity"
};

//Data for fake API Gateway Server
var fakeApiGatewayPort = port + 2;
var fakeApiGatewayUrl = host + ":" + fakeApiGatewayPort;

var fakeApiGatewayConfig = {
    clientUrl: host,
    port: fakeApiGatewayPort,
    serverType: 'fakeApiGateway',
    serverName: 'Fake API Gateway Server'
}

var dataPath = "/api/jivelinks/v1/extstreams/1234";
var dataUrl = fakeApiGatewayUrl + dataPath;

var dataPushEndpoint = {
    "type": "setEndpoint",
    "method": "POST", // POST for activity
    "path": dataPath,
    "statusCode": 204,
    "body": "",
    "headers": { "Content-Type": "application/json" }
};

var basicAuth = testUtil.makeBasicAuth(integrationConfig.clientId, integrationConfig.clientSecret);

var registrationRequest =
{
    "code": integrationConfig.clientSecret,
    "name": "sampleactivity",
    "config": {"config": "value"},
    "url": fakeApiGatewayUrl + dataPushEndpoint.path,
    "guid": testUtil.makeGuid(fakeApiGatewayUrl, false, 1234)
}


//************************MOCHA TESTS************************
describe('Activity push tests', function () {

    //Configure mock Jive ID server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(jiveIdServerConfig)
            .then(function (serverProc) {
                jiveIdServerProc = serverProc;
                return testUtil.sendOperation(setEnvironmentConfig, testRunner.serverProcess());
            })
            .thenResolve(testUtil.createServer(fakeApiGatewayConfig))
            .then(function (serverProc) {
                fakeApiGatewayProc = serverProc;
                return testUtil.sendOperation(dataPushEndpoint, serverProc);
            })
            .then(function () {
                done();
            }, done);
    });

    beforeEach(function (done) {
        testUtil.clearInstances(testRunner.serverProcess()).then(function () {
            return testUtil.clearGrantTypeResponses(jiveIdServerProc);
        }).then(function () {
                return testUtil.clearAllTasks(testRunner.serverProcess());
            })
            .then(function () {
                done();
            }, done);
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeApiGatewayProc))
            .then(done, done);
    });


    it("Register tile and push activity", function (done) {
        var taskKey = null;

        testUtil.sendOperation(addTaskConfig, testRunner.serverProcess()).then(function (m) {
            taskKey = m['task'];
            var promise = testUtil.waitForMessage(testRunner.serverProcess(), 'pushedActivity');
            testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true);
            return promise;

        }).then(function (res) {
                if (res.statusCode != 204) {
                    assert.fail(res.statusCode, 204, "Expected datapush to be successful, return 204");
                }

                return testUtil.sendOperation({"type": "removeTask", "task": taskKey}, testRunner.serverProcess());
            })
            .then(function () {
                done();
            }, done);
    });



});


