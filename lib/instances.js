/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * Library of common methods for manipulating instances.
 */
/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var q = require('q');
var persistence = require('../persistence/dispatcher');
var jiveUtil = require('./jiveutil');
var jiveClient = require('./client');

function Instances() {
}

Instances.prototype = Object.create({}, {
    constructor: {
        value: Instances,
        enumerable: false
    }
});

module.exports = Instances;

var returnOne = function(found ) {
    if ( found == null || found.length < 1 ) {
        return null;
    } else {
        // return first one
        return found[0];
    }
};

Instances.prototype.getCollection = function() {
    throw 'Must be subclassed';
};

Instances.prototype.save = function (tileInstance) {
    if (!tileInstance.id) {
        tileInstance.id = jiveUtil.guid();
    }

    return persistence.save(this.getCollection(), tileInstance.id, tileInstance );
};

Instances.prototype.find = function ( keyValues, expectOne ) {
    return persistence.find(this.getCollection(), keyValues).then( function( found ) {
        return expectOne ? returnOne( found ) : found;
    } );
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
    return persistence.remove(this.getCollection(), tileInstanceID );
};

Instances.prototype.register = function (client_id, url, config, name, code ) {
    var deferred = q.defer();

    var options = {
        client_id: client_id,
        code: code
    };

    jiveClient.TileInstance.register(options, function (accessTokenResponse) {
        console.log("Reached Access Token Exchange callback", accessTokenResponse);

        var tileInstance = {
            url: url,
            setup: config,
            name: name
        };

        tileInstance['accessToken'] = accessTokenResponse['access_token'];
        tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
        tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
        tileInstance['scope'] = accessTokenResponse['scope'];

        deferred.resolve( tileInstance );
    });

    return deferred.promise;
};

Instances.prototype.refreshAccessToken = function (client_id, tileInstance) {

    var options = {
        client_id: client_id,
        refresh_token: tileInstance['refreshToken']
    };

    var deferred = q.defer();

    jiveClient.TileInstance.refreshAccessToken(options,
        function (accessTokenResponse) {
            // success
            tileInstance['accessToken'] = accessTokenResponse['access_token'];
            tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
            tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
            deferred.resolve(tileInstance);
        }, function (result) {
            // failure
            console.log('error refreshing access token for ', tileInstance, result);
            deferred.reject(result);
        }
    );

    return deferred.promise;
};
