var persistence = require('../persistence/dispatcher');
var jiveUtil = require('../util');
var jiveClient = require('../client');

function Instances() {
}

Instances.prototype = Object.create({}, {
    constructor: {
        value: Instances,
        enumerable: false
    }
});

module.exports = Instances;

var returnOne = function(found, callback ) {
    if ( found == null || found.length < 1 ) {
        callback( null );
    } else {
        // return first one
        callback( found[0] );
    }
};

Instances.prototype.getCollection = function() {
    throw 'Must be subclassed';
};

Instances.prototype.save = function (tileInstance) {
    var self = this;
    if (!tileInstance.id) {
        tileInstance.id = jiveUtil.guid();
    }

    return {
        execute: function (callback) {
            persistence.save(self.getCollection(), tileInstance.id, tileInstance, function( saved ) {
                callback(saved);
            });
        }
    }
};

Instances.prototype.find = function ( keyValues, expectOne ) {
    var self = this;
    return {
        execute: function (callback) {
            persistence.find(self.getCollection(), keyValues, function( found ) {
                if ( expectOne ) {
                    returnOne( found, callback )
                } else {
                    callback ( found );
                }
            } );
        }
    }
};

Instances.prototype.findByID = function (tileInstanceID) {
    return this.find( { "id" : tileInstanceID }, true );
};

Instances.prototype.findByDefinitionName = function (definitionName) {
    return this.find( { "name": definitionName } );
};

Instances.prototype.findByScope = function (scope) {
    return this.find( { "scope" : scope }, true );
};

Instances.prototype.findAll = function () {
    return this.find( null );
};

Instances.prototype.remove = function (tileInstanceID) {
    var self = this;
    return {
        execute: function (callback) {
            persistence.remove(self.getCollection(), tileInstanceID, callback);
        }
    }
};

Instances.prototype.register = function (client_id, url, config, name, code ) {

    // todo -- validation?

    return {
        execute: function (callback) {
            var options = {
                client_id: client_id,
                code: code
            };

            jiveClient.TileInstance.register(options, function (accessTokenResponse) {
                console.log("Reached Access Token Exchange callback", accessTokenResponse);

                var tileInstance = {
                    url: url,
                    config: config,
                    name: name
                };

                tileInstance['accessToken'] = accessTokenResponse['access_token'];
                tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
                tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
                tileInstance['scope'] = accessTokenResponse['scope'];

                callback(tileInstance);
            });

        }
    }
};

Instances.prototype.refreshAccessToken = function (client_id, tileInstance) {
    var options = {
        client_id: client_id,
        refresh_token: tileInstance['refreshToken']
    };

    return {
        execute: function (success, failure) {
            jiveClient.TileInstance.refreshAccessToken(options,
                function (accessTokenResponse) {
                    // success
                    tileInstance['accessToken'] = accessTokenResponse['access_token'];
                    tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
                    tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
                    success(tileInstance);
                }, function (result) {
                    // failure
                    console.log('error refreshing access token for ', tileInstance, result);
                    failure(result);
                }
            )
        }
    }

};
