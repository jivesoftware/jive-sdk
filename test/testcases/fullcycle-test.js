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
    mockJiveId: true,
    serverName: 'Fake Jive ID Server'
}

var setEnvironmentConfig = {
    "type": "setEnv",
    "env" : {
        'jive.jiveid.servers.public' : jiveIdBase,
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
    fakeJiveServer: true,
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
                return testUtil.configServer(setEnvironmentConfig, testRunner.serverProcess());
            })
            .thenResolve(testUtil.createServer(fakeJiveServerConfig, {silent: true}))
            .then(function(serverProc) {
                fakeJiveServerProc = serverProc;
                return testUtil.configServer(dataPushEndpoint, serverProc);
            })
            .then(done);
    });

    after(function (done) {
        testUtil.stopServer(jiveIdServerProc)
            .thenResolve(testUtil.stopServer(fakeJiveServerProc))
            .then(done);
    });

    describe('#fullcycle()', function () {
        it("Full cycle registration - basic", function (done) {

            testUtil.configServer(addTaskConfig, testRunner.serverProcess()).then(function(m) {

                var task  = m['task'];

                testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization" : basicAuth}, true);

                var isDone = false;
                testRunner.serverProcess().on("message", function(m) {
                    var pushedData =  m['pushedData'];
                    if ( pushedData && !isDone ) {
                        if ( pushedData.statusCode != 204 ) {
                            assert.fail( pushedData.statusCode, 204, "Expected datapush to be successful, return 204");
                        } else {
                            isDone = true;
                            testUtil.configServer({"type": "removeTask", "task":task}, testRunner.serverProcess()).then( function() {
                                done();
                            })
                        }
                    }
                });

            });

        });
    });

    describe('#fullcycleAccessTokenExchange()', function () {
        it("Full cycle registration - access token exchange", function (done) {


            var dataPushEndpoint = {
                "type": "setEndpoint",
                "method": "PUT",
                "path": "/api/jivelinks/v1/tiles/1234/data",
                "statusCode": 401,
                "body": "",
                "headers": { "Content-Type": "application/json" }
            };


            testUtil.configServer(dataPushEndpoint, fakeJiveServerProc).then( function() {

                testUtil.configServer(addTaskConfig, testRunner.serverProcess()).then(function(m) {

                    var task  = m['task'];

                    testUtil.post(base + "/registration", 201, null, registrationRequest, {"Authorization" : basicAuth}, true);

                    var isDone = false;
                    testRunner.serverProcess().on("message", function(m) {
                        var pushedData =  m['pushedData'];
                        if ( pushedData && !isDone ) {
                            if ( pushedData.statusCode != 204 ) {
                                assert.fail( pushedData.statusCode, 204, "Expected datapush to be successful, return 204");
                            } else {
                                isDone = true;
                                testUtil.configServer({"type": "removeTask", "task":task}, testRunner.serverProcess()).then( function() {
                                    done();
                                })
                            }
                        }
                    });

                });


            });


        });
    });



});


