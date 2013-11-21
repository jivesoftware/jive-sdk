var q = require('q');

exports.testSave = function(testUtils, persistence ) {
    var deferred = q.defer();

    var obj = {
        'data' : testUtils.guid()
    };

    try {
        persistence.save(testUtils.guid(), testUtils.guid(), obj ).then( function(saved) {
            if ( !saved ) {
                deferred.reject(new Error('Did not save object'));
            }

            if ( saved['data'] !== obj['data'] ) {
                deferred.reject(new Error('Data did not persist'));
            } else {
                deferred.resolve();
            }
        }, function(e) {
            deferred.reject(e);
        });
    } catch( e ) {
        deferred.reject(e);
    }

    return deferred.promise;
};