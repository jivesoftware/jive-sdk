var q = require('q');
var path = require('path');
var testUtils = require('./testUtils');
var funcster = require('funcster');

var serverProcess;

exports.start = function(config, procOptions) {
    var deferred = q.defer();

    if (!procOptions) {
        procOptions = {};
    }
    procOptions.execArgv = [];

    serverProcess = require('child_process').fork('./util/serverProcessDriver',  procOptions);
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
};

exports.stop = function() {
    var id = testUtils.guid();
    return sendOperation({
        pleaseStop: true,
        id: id
    });
};

exports.setEndpoint = function( method, statusCode, path, body, handler) {
    method = method.toUpperCase();
    if (method != "GET" && method != "PUT" && method != "POST" && method != "DELETE") {
        throw Error('Invalid method given in setEndpoint: ' + method);
    }
    if (path.indexOf('/') != 0) {
        throw Error('Path must start with a "/" in testUtil.setEndpoint. Path given: ' + path);
    }
    if (typeof body === 'object') {
        body = JSON.stringify(body);
    }
    var serializedHandler;
    if ( handler ) {
        serializedHandler = funcster.deepSerialize(handler);
    }
    var operation = {
        "type": "setEndpoint",
        "method": method,
        "path": path,
        "statusCode": statusCode,
        "body": body,
        "headers": { "Content-Type": "application/json" }
    };

    if ( serializedHandler ) {
        operation['handler'] = serializedHandler;
    }

    return sendOperation(operation, serverProcess);
};

function sendOperation(operationJson) {
    var deferred = q.defer();
    var id = testUtils.guid();

    serverProcess.on('message', function(m) {
        if (m.id == id) {
            serverProcess.removeListener('message', arguments.callee);
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

    serverProcess.send({
        operation: operationJson,
        id: id
    });

    return deferred.promise;
}
