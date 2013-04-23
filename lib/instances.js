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
var jiveUtil = require('./jiveutil');
var jiveClient = require('./client');
var jive = require('../api');

var returnOne = function(found ) {
    if ( found == null || found.length < 1 ) {
        return null;
    } else {
        // return first one
        return found[0];
    }
};

exports.persistence = function() {
    return jive.service.persistence();
};

exports.getCollection = function() {
    throw 'Must be subclassed';
};

exports.save = function (tileInstance) {
    if (!tileInstance.id) {
        tileInstance.id = jiveUtil.guid();
    }

    return this.persistence().save(this.getCollection(), tileInstance.id, tileInstance );
};

exports.find = function ( keyValues, expectOne ) {
    return this.persistence().find(this.getCollection(), keyValues).then( function( found ) {
        return expectOne ? returnOne( found ) : found;
    } );
};

exports.findByID = function (tileInstanceID) {
    return this.find( { "id" : tileInstanceID }, true );
};

exports.findByDefinitionName = function (definitionName) {
    return this.find( { "name": definitionName } );
};

exports.findByScope = function (scope) {
    return this.find( { "scope" : scope }, true );
};

exports.findAll = function () {
    return this.find( null );
};

exports.remove = function (tileInstanceID) {
    return this.persistence().remove(this.getCollection(), tileInstanceID );
};

exports.register = function (client_id, url, config, name, code ) {
    var deferred = q.defer();

    var options = {
        client_id: client_id,
        code: code
    };

    jiveClient.requestAccessToken(options,

        // success
        function (response) {
            jive.logger.debug("Reached Access Token Exchange callback", response);
            var accessTokenResponse = response['entity'];

            var tileInstance = {
                url: url,
                config: config,
                name: name
            };

            tileInstance['accessToken'] = accessTokenResponse['access_token'];
            tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
            tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
            tileInstance['scope'] = accessTokenResponse['scope'];

            deferred.resolve( tileInstance );
        },

        // failure
        function(err) {
            jive.logger.error("Failed access token exchange!", err);
            deferred.reject( err );
        }
    );

    return deferred.promise;
};

exports.refreshAccessToken = function (client_id, tileInstance) {

    var options = {
        client_id: client_id,
        refresh_token: tileInstance['refreshToken']
    };

    var deferred = q.defer();

    jiveClient.refreshAccessToken(options,
        function (response) {
            if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
                var accessTokenResponse = response['entity'];

                // success
                tileInstance['accessToken'] = accessTokenResponse['access_token'];
                tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
                tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
                deferred.resolve(tileInstance);
            }  else {
                jive.logger.error('error refreshing access token for ', tileInstance);
                deferred.reject( response );
            }
        }, function (result) {
            // failure
            jive.logger.error('error refreshing access token for ', tileInstance, result);
            deferred.reject(result);
        }
    );

    return deferred.promise;
};
