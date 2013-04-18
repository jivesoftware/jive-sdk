var testRunner = require('./node-test-runner'),
    q = require('q'),
    uuid = require('node-uuid');

//*************************EXPORTED*****************************

exports.configServer = function(operationJson) {

    var deferred = q.defer();
    var id = uuid.v4();
    var serverProc = testRunner.serverProcess();

    serverProc.send({
        operation: operationJson,
        id: id
    });

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

    return deferred.promise;
}
