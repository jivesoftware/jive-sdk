var jive = require('../../../jive-sdk'),
    assert = require('assert'),
    testUtil = require('../test-util');

var host = jive.service.options['clientUrl'];
var port = jive.service.options['port'];
var base = host + ":" + port;

//Configure fake server for generic testing of jiveutil
var fakeServerPort = port + 1;
var fakeServerUrl = host + ":" + fakeServerPort;

var fakeServerConf = {
    'port': fakeServerPort,
    'clientUrl': host,
    'serverName': 'Fake REST server for jiveutil tests',
    'serverType': 'genericServer'
};

var fakeServerProcess = null;

var getEndpoint = {
    "type": "setEndpoint",
    "method": "GET",
    "path": "/test",
    "statusCode": 200,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

var postEndpoint = {
    "type": "setEndpoint",
    "method": "POST",
    "path": "/test",
    "statusCode": 204,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

//************************MOCHA TESTS************************

describe('jive.util', function () {


    //Configure server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(fakeServerConf, {silent: true})
            .then(function (serverProc) {
                fakeServerProcess = serverProc;
                return testUtil.sendOperation(getEndpoint, fakeServerProcess);
            })
            .then(function() {
                testUtil.sendOperation(postEndpoint, fakeServerProcess)
            })
            .then(done);
    });

    after(function (done) {
        testUtil.stopServer(fakeServerProcess)
            .then(done);
    });

    describe('#buildRequest()', function () {
        it("GET to /test", function (done) {
            testUtil.get(fakeServerUrl + getEndpoint.path, 200, null).then(function (res) {
                done();
            });
        });

        it("POST to /test with empty body returns 400", function (done) {
            testUtil.post(fakeServerUrl + postEndpoint.path, 400, null, null).then(function (res) {
                done();
            });
        });

        it("POST to /test", function (done) {
            testUtil.post(fakeServerUrl + postEndpoint.path, postEndpoint.statusCode, null, {}).then(function (res) {
                done();
            });
        });
    });
});


//*********************************************Helpers*********************************************
//For Mocha framework, need to call "done" after a callback to indicate the test completed for asynchronous tests
function wrap(f, done) {
    return function (arg) {
        f(arg);
        done();
    }
}