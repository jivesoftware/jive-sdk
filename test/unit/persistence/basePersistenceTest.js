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

exports.testFind = function( testUtils, persistence ) {
    var deferred = q.defer();

    try {

        function pretty(result) {
            return '\n' + JSON.stringify(result, null, 4) + '\n';
        }

        // setup some data
        persistence.save(               'myCollection', '123', { 'key': '1', 'data': { 'name': 'aron', 'age': '6' } } )

            .then( function( ) {
                return persistence.save('myCollection', '456', { 'key': '2', 'data': { 'name': 'allen' } });
            })
            .then( function( ) {
                return persistence.save('myCollection', '789', { 'key': '3', 'data': { 'name': 'abbey', 'age' : '6' } });
            })

            // find by ID
            .then( function( ) {
                return persistence.findByID('myCollection', '789').then( function(result) {
                    if ( !result ) {
                        deferred.reject('Failed find by ID');
                    }
                    if ( result['data']['name'] !== 'abbey') {
                        deferred.reject('Failed find by ID, found wrong result');
                    }
                });
            })

            .then( function( ) {
                return persistence.find('myCollection',
                    { 'key' : '2' }
                ).then( function(result) {
                    if ( !result ) {
                        deferred.reject('Find by key search');
                    }
                    if ( result.length != 1 ) {
                        deferred.reject('Find by key search');
                    }
                    if ( result[0]['data']['name'] !== 'allen') {
                        deferred.reject('Failed find by ID, found wrong result');
                    }
                });
            })

            .then( function( ) {
                return persistence.find('myCollection',
                    { 'data.age' : '6', 'data.name' : 'aron' }
                ).then( function(result) {
                    if ( !result ) {
                        deferred.reject('Failed nested find');
                    }
                    if ( result.length != 1 ) {
                        deferred.reject('Find by key search');
                    }
                    if ( result[0]['data']['name'] !== 'aron') {
                        deferred.reject('Failed find by ID, found wrong result');
                    }
                });
            })

            // find
            .then( function( ) {
                return persistence.find('myCollection',
                    { 'data.age' : '6' }
                ).then( function(result) {
                    if ( result.length != 2 ) {
                        deferred.reject('Failed find multiple results');
                    }
                });
            }).then( function() {
                deferred.resolve();
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