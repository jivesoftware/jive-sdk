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
    "statusCode": 500,
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

var putEndpoint = {
    "type": "setEndpoint",
    "method": "PUT",
    "path": "/test",
    "statusCode": 201,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

var deleteEndpoint = {
    "type": "setEndpoint",
    "method": "DELETE",
    "path": "/test",
    "statusCode": 200,
    "body": "{\"key\": \"value\"}",
    "headers": { "Content-Type": "application/json" }
};

//************************MOCHA TESTS************************

describe('jive.util', function () {


    //Configure server first. Call done() on completion for mocha to be happy
    before(function (done) {
        testUtil.createServer(fakeServerConf)
            .then(function (serverProc) {
                fakeServerProcess = serverProc;
                return testUtil.sendOperation(getEndpoint, fakeServerProcess);
            })
            .then(function() {
                return testUtil.sendOperation(postEndpoint, fakeServerProcess);
            })
            .then(function() {
                return testUtil.sendOperation(putEndpoint, fakeServerProcess);
            })
            .then(function() {
                return testUtil.sendOperation(deleteEndpoint, fakeServerProcess);
            })
            .then(function() {done();}, done);
    });

    after(function (done) {
        testUtil.stopServer(fakeServerProcess)
            .then(done, done);
    });

    describe('#buildRequest()', function () {
        it("GET to /test returns " + getEndpoint.statusCode, function (done) {
            testUtil.get(fakeServerUrl + getEndpoint.path, getEndpoint.statusCode, null).then(function (res) {
                done();
            }, done);
        });

        it("POST to /test with empty body returns 204", function (done) {
            testUtil.post(fakeServerUrl + postEndpoint.path, postEndpoint.statusCode, null, null).then(function (res) {
                done();
            }, done);
        });

        it("POST to /test returns 204", function (done) {
            testUtil.post(fakeServerUrl + postEndpoint.path, postEndpoint.statusCode, null, {"testKey": "value"}).then(function (res) {
                done();
            }, done);
        });

        it("PUT to /test with empty body returns 201", function (done) {
            testUtil.put(fakeServerUrl + putEndpoint.path, putEndpoint.statusCode, null, null).then(function (res) {
                done();
            }, done);
        });

        it("PUT to /test returns 201", function (done) {
            testUtil.put(fakeServerUrl + putEndpoint.path, putEndpoint.statusCode, null, {"testKey" : "value"}).then(function (res) {
                done();
            }, done);
        });

        it("DELETE to /test returns 200", function (done) {
            testUtil.delete(fakeServerUrl + deleteEndpoint.path, deleteEndpoint.statusCode).then(function (res) {
                done();
            }, done);
        });
    });
});