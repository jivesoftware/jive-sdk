var q = require('q'),
    uuid = require('node-uuid'),
    jive = require('.'),
    assert = require('assert');

//*************************EXPORTED*****************************

/**
 * Send a configuration operation to the given server process, e.g. for modifying the endpoints. See test-server.js.
 *
 * @param operationJson
 * @param serverProc
 * @return {Function|promise|promise|Q.promise}
 */
function sendOperation(operationJson, serverProc) {

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
exports.sendOperation = sendOperation;

/**
 * Creates a new server in a forked process and returns a promise to act on after the server is up
 */
function createServer(config, procOptions) {
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
};
exports.createServer = createServer;

/** Stop the test server running at the given */
function stopServer(serverProc) {

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
};
exports.stopServer = stopServer;

function waitForMessage(serverProcess, key) {
    var deferred = q.defer();
    serverProcess.on('message', function(m){
        if (m.hasOwnProperty(key)) {
            serverProcess.removeListener('message', arguments.callee);
            deferred.resolve(m[key]);
        }
    });
    return deferred.promise;
}
exports.waitForMessage = waitForMessage;

function waitForMessageValue(serverProcess, requiredKey, required) {
    var deferred = q.defer();

    serverProcess.on('message', function(m){
        if (m.hasOwnProperty(requiredKey)) {
            var value = m[requiredKey];
            for (var key in required) {
                if (value[key] != required[key]) {
                    return;
                }
            }
            serverProcess.removeListener('message', arguments.callee);
            deferred.resolve(value);
        }
    });
    return deferred.promise;
}
exports.waitForMessageValue = waitForMessageValue;

function clearInstances(integrationProcess) {
      var waitForMsg = exports.waitForMessage(integrationProcess, 'dbCleared').then(function(m){
          if (m===true) {
              //console.log('Test util received message that DB was cleared!');
          }
          else {
              console.log('Failure to clear DB');
              throw Error('Failure, DB not cleared: ' + JSON.stringify(m));
          }
      });
      var waitForConfig = exports.sendOperation({'type': 'clearInstances'}, integrationProcess);
      return waitForMsg;

}
exports.clearInstances = clearInstances;

function registerTile(integrationConfig, tileName, dataUrl, tileConfig) {

    if (!tileConfig) {
        tileConfig = {"config" : "value"};
    }
    var registrationRequest =
    {
        "code": integrationConfig.clientSecret,
        "name": tileName,
        "config": tileConfig,
        "url": dataUrl,
        "guid": exports.makeGuid('http://localhost', true, 1234)
    }

    var host = integrationConfig['clientUrl'];
    var port = integrationConfig['port'];
    var integrationUrl = host + (port ? ":" + port : "");
    var basicAuth = makeBasicAuth(integrationConfig.clientId, integrationConfig.clientSecret);
    return post(integrationUrl + "/registration", 201, null, registrationRequest, {"Authorization": basicAuth}, true)
        .then(function(res){
            var entity = res['entity'];
            return entity['id'];
        });
}
exports.registerTile = registerTile;

function findTile(integrationProcess, tileId) {
    var promise = waitForMessage(integrationProcess, 'result');

    sendOperation({'type': 'findTile', 'tileId': tileId}, integrationProcess);

    return promise;
}
exports.findTile = findTile;

function setGrantTypeResponse(jiveIdProcess, grantType, statusCode, body) {
    var grantTypeJson = {};
    grantTypeJson[grantType] = {
        'statusCode' : statusCode,
        'response': body
    };
    return sendOperation({"type" : "changeResponseToGrantTypes", "grantTypeResponses" : grantTypeJson}, jiveIdProcess);
}
exports.setGrantTypeResponse = setGrantTypeResponse;

function clearGrantTypeResponses(jiveIdProcess) {
    var grantTypeJson = {
        "authorization" : null,
        "refresh_token": null
    };

    return exports.sendOperation({"type" : "changeResponseToGrantTypes", "grantTypeResponses" : grantTypeJson}, jiveIdProcess);
}
exports.clearGrantTypeResponses = clearGrantTypeResponses;

function clearAllTasks(integrationProcess) {
    return sendOperation({'type': 'clearAllTasks'}, integrationProcess);
}
exports.clearAllTasks = clearAllTasks;

function setEndpoint(serverProcess, method, statusCode, path, body) {
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
    var operation = {
        "type": "setEndpoint",
        "method": method,
        "path": path,
        "statusCode": statusCode,
        "body": body,
        "headers": { "Content-Type": "application/json" }
    };
    return sendOperation(operation, serverProcess);
}

exports.setEndpoint = setEndpoint;

/********************************REQUEST UTILS********************************/

function get(url, expectedStatus, expectedEntity, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "GET", null, null, doPrintResponse);
}

exports.get = get;

function post(url, expectedStatus, expectedEntity, body, headers, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "POST", body, headers, doPrintResponse);
}

exports.post = post;

function put(url, expectedStatus, expectedEntity, body, headers, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "PUT", body, headers, doPrintResponse);
}

exports.put = put;

function doDelete(url, expectedStatus, expectedEntity, body, headers, doPrintResponse) {
    return testClientRequest(url, expectedStatus, expectedEntity, "DELETE", body, headers, doPrintResponse);
}

exports.delete = doDelete;

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
            assert.fail(res.statusCode, expectedStatus, "Status code from server incorrect: actual=" + res.statusCode + ",expected=" + expectedStatus);
        }

        if (expectedEntity) {
            for (var key in expectedEntity) {
                if (entity[key] != expectedEntity[key]) {
                    assert.fail(entity[key], expectedEntity[key], "Entity from server differed from expected at key '" + key + "'");
                }
            }
        }

        return res; //For additional promise chaining
    };
};

function errorCallback () {
    return function(err) {
        console.log(err);
        assert.ifError(err);
    }
};

function makeBasicAuth(user, password) {
    var tok = user + ":" + password;
    var hash = new Buffer(tok).toString('base64');
    return "Basic " + hash;
}

exports.makeBasicAuth = makeBasicAuth;

function makeGuid(communityUrl, isTile, tileOrExtstreamId) {
    communityUrl = communityUrl.replace("http://","");
    return "community:" + encodeURIComponent(communityUrl) + (isTile ? "/tile:" : "/extstream:") + tileOrExtstreamId;
}

exports.makeGuid = makeGuid;

