var q = require('q'),
    uuid = require('node-uuid'),
    jive = require('../../jive-sdk'),
    assert = require('assert');

//*************************EXPORTED*****************************

/**
 * Send a configuration operation to the given server process, e.g. for modifying the endpoints. See test-server.js.
 *
 * @param operationJson
 * @param serverProc
 * @return {Function|promise|promise|Q.promise}
 */
exports.configServer = function(operationJson, serverProc) {

    //If no server process is provided, use the default server process provided by the test runner
    if (!serverProc) {
        serverProc = require('./node-test-runner').serverProcess();
    }

    var deferred = q.defer();
    var id = uuid.v4();

    serverProc.on('message', function(m) {
       if (m.id == id) {
           serverProc.removeListener('message', arguments.callee);
           var success = m.operationSuccess;
           if (success) {
                var context = m['context'];
                deferred.resolve(context);
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
exports.createServer = function(config, procOptions) {
    var deferred = q.defer();

    if (!procOptions) {
        procOptions = {};
    }
    procOptions.execArgv = [];
    var serverProcess = require('child_process').fork('./test-server',  procOptions);

    var serverStartedCallback = function(m) {

        serverProcess.removeListener('message', arguments.callee);
        var success = m.serverStarted;
        if (success) {
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
        serverProc = require('./node-test-runner').serverProcess();
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

/********************************REQUEST UTILS********************************/

exports.get = function(url, expectedStatus, expectedEntity, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "GET", null, null, doPrintResponse);
}

exports.post = function(url, expectedStatus, expectedEntity, body, headers, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "POST", body, headers, doPrintResponse);
}

exports.put = function(url, expectedStatus, expectedEntity, body, headers, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "PUT", body, headers, doPrintResponse);
}

exports.delete = function(url, expectedStatus, expectedEntity, body, headers, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "DELETE", body, headers, doPrintResponse);
}

function testClientRequest(url, expectedStatus, expectedEntity, method, body, headers, doPrintResponse) {
    return jive.util.buildRequest(url, method, body, headers, null)
        .then(
            successCallback(expectedStatus, expectedEntity, doPrintResponse),
            successCallback(expectedStatus, expectedEntity, doPrintResponse)
        );
}

function successCallback (expectedStatus, expectedEntity, doPrintResponse) {

    return function (res) {
        if (doPrintResponse) {
            console.log(res.entity);
        }
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
    };
};

function errorCallback () {
    return function(err) {
        console.log(err);
        assert.ifError(err);
    }
};

exports.makeBasicAuth = function(user, password) {
    var tok = user + ":" + password;
    var hash = new Buffer(tok).toString('base64');
    return "Basic " + hash;
}

exports.makeGuid = function(communityUrl, isTile, tileOrExtstreamId) {
    communityUrl = communityUrl.replace("http://","");
    return "community:" + encodeURIComponent(communityUrl) + (isTile ? "/tile:" : "/extstream:") + tileOrExtstreamId;
}

