var testRunner = require('./node-test-runner'),
    q = require('q'),
    uuid = require('node-uuid'),
    jive = require('../../jive-sdk'),
    assert = require('assert');

//*************************EXPORTED*****************************

exports.configServer = function(operationJson, serverProc) {

    //If no server process is provided, use the default server process provided by the test runner
    if (!serverProc) {
        serverProc = testRunner.serverProcess();
    }

    var deferred = q.defer();
    var id = uuid.v4();

    serverProc.on('message', function(m) {
       if (m.id == id) {
           serverProc.removeListener('message', arguments.callee);
           var success = m.operationSuccess;
           if (success) {
                deferred.resolve();
           }
            else if (success === false) {
               deferred.reject('Server failed to re-configure: ' + JSON.stringify(m));
           }
       }
    });

    serverProc.send({
        operation: operationJson,
        id: id
    });

    return deferred.promise;
}

/**
 * Creates a new server in a forked process and returns a promise to act on after the server is up
 */
exports.createServer = function(config) {
    var deferred = q.defer();

    var serverProcess = require('child_process').fork('./test-server',  {execArgv: [], silent: true});

    var serverStartedCallback = function(m) {

        serverProcess.removeListener('message', arguments.callee);
        var success = m.serverStarted;
        if (success) {
            console.log("Test server started");
            deferred.resolve(serverProcess);
        }
        else {
            deferred.reject('Failure starting test server' + JSON.stringify(m));
            console.log("Failure starting test server!");
        }

    };

    //Setup listener for when server starts and sends a message back
    serverProcess.on('message', serverStartedCallback);

    //Tell the server to start
    serverProcess.send({pleaseStart: true, config: config});

    return deferred.promise;
}

exports.stopServer = function(serverProc) {

    //If no server process is provided, use the default server process provided by the test runner
    if (!serverProc) {
        serverProc = testRunner.serverProcess();
    }

    var deferred = q.defer();
    var id = uuid.v4();

    serverProc.on('message', function(m) {
        if (m.id == id) {
            serverProc.removeListener('message', arguments.callee);
            var success = m.serverStopped;
            if (success) {
                deferred.resolve();
            }
            else {
                deferred.reject('Server failed to stop: ' + JSON.stringify(m));
            }
        }
    });

    serverProc.send({
        pleaseStop: true,
        id: id
    });

    return deferred.promise;
}

exports.get = function(url, expectedStatus, expectedEntity) {
    return testClientRequest(url, expectedStatus, expectedEntity, "GET", null, null);
}

exports.post = function(url, expectedStatus, expectedEntity, body, headers) {
    return testClientRequest(url, expectedStatus, expectedEntity, "POST", body, headers);
}

exports.put = function(url, expectedStatus, expectedEntity, body, headers) {
    return testClientRequest(url, expectedStatus, expectedEntity, "PUT", body, headers);
}

exports.delete = function(url, expectedStatus, expectedEntity, headers) {
    return testClientRequest(url, expectedStatus, expectedEntity, "DELETE", body, headers);
}

function testClientRequest(url, expectedStatus, expectedEntity, method, body, headers) {
    var deferred = q.defer();
    jive.util.buildRequest(url, method, body, headers, null)
        .execute(successCallback(expectedStatus, expectedEntity, deferred), errorCallback(deferred));

    return deferred.promise;
}

function successCallback (expectedStatus, expectedEntity, deferred) {

    return function (res) {
        var entity = res.entity;
        if (res.statusCode != expectedStatus) {
            assert.fail(res.statusCode, expectedStatus, "Status code from server incorrect");
        }

        if (expectedEntity) {
            for (var key in expectedEntity) {
                if (entity[key] != expectedEntity[key]) {
                    assert.fail(entity[key], expectedEntity[key], "Entity from server differed from expected at key '" + key + "'");
                }
            }
        }
        deferred.resolve(res);
    };
};

function errorCallback (deferred) {
    return function(err) {
        console.log(err);
        assert.ifError(err);
        deferred.resolve(err);
    }
};

exports.makeBasicAuth = function(user, password) {
    var tok = user + ":" + password;
    var hash = new Buffer(tok).toString('base64');
    return "Basic " + hash;
}

