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

exports.testRemove = function(testUtils, persistence ) {
    var deferred = q.defer();

    var obj = {
        'data' : testUtils.guid()
    };

    try {
        var key = testUtils.guid();
        var collection = testUtils.guid();
        persistence.save(collection, key, obj ).then( function(saved) {
            if ( !saved ) {
                deferred.reject(new Error('Did not save object'));
            }
            persistence.remove( collection, key )
            .then( function() {
                persistence.findByID(collection, key).then( function(found) {
                    if ( found ){
                        deferred.reject(new Error("Did not expect to find deleted object"));
                    } else {
                        deferred.resolve();
                    }
                });
            });
        });
    } catch( e ) {
        deferred.reject(e);
    }

    return deferred.promise;
};