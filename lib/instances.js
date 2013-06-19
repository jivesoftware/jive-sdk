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
var pusher = require('./dataPusher');

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

exports.save = function (instance) {
    if (!instance.id) {
        instance.id = jiveUtil.guid();
    }

    return this.persistence().save(this.getCollection(), instance.id, instance );
};

exports.find = function ( keyValues, expectOne ) {
    return this.persistence().find(this.getCollection(), keyValues).then( function( found ) {
        return expectOne ? returnOne( found ) : found;
    } );
};

exports.findByID = function (instanceID) {
    return this.find( { "id" : instanceID }, true );
};

exports.findByDefinitionName = function (definitionName) {
    return this.find( { "name": definitionName } );
};

exports.findByScope = function (scope) {
    return this.find( { "scope" : scope }, true );
};

exports.findByURL = function (url) {
    return this.find( { "url" : url }, true );
};

exports.findByCommunity = function (community) {
    return this.find( { "jiveCommunity" : community }, true );
};

exports.findAll = function () {
    return this.find( null );
};

exports.remove = function (instanceID) {
    return this.persistence().remove(this.getCollection(), instanceID );
};

exports.register = function (jiveUrl, pushUrl, config, name, code ) {
    var deferred = q.defer();

    var options = {
        client_id: jive.service.options['clientId'],
        client_secret: jive.service.options['clientSecret'],
        code: code,
        jiveUrl: jiveUrl
    };

    jiveClient.requestAccessToken(options,

        // success
        function (response) {
            jive.logger.debug("Reached Access Token Exchange callback", response);
            var accessTokenResponse = response['entity'];

            var instance = {
                url: pushUrl,
                config: config,
                name: name
            };

            var scope = accessTokenResponse['scope'];

            instance['accessToken'] = accessTokenResponse['access_token'];
            instance['expiresIn'] = accessTokenResponse['expires_in'];
            instance['refreshToken'] = accessTokenResponse['refresh_token'];
            instance['scope'] = scope;
            instance['jiveCommunity'] = jiveUrl || decodeURIComponent(scope.split(/:/)[1].split('/')[0]).split(/:/)[0];

            deferred.resolve( instance );
        },

        // failure
        function(err) {
            jive.logger.error("Failed access token exchange!", err);
            deferred.reject( err );
        }
    );

    return deferred.promise;
};

exports.refreshAccessToken = function (instance) {

    var options = {
        client_id: jive.service.options['clientId'],
        refresh_token: instance['refreshToken']
    };

    var deferred = q.defer();

    jiveClient.refreshAccessToken(options,
        function (response) {
            if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
                var accessTokenResponse = response['entity'];

                // success
                instance['accessToken'] = accessTokenResponse['access_token'];
                instance['expiresIn'] = accessTokenResponse['expires_in'];
                instance['refreshToken'] = accessTokenResponse['refresh_token'];
                deferred.resolve(instance);
            }  else {
                jive.logger.error('error refreshing access token for ', instance);
                deferred.reject( response );
            }
        }, function (result) {
            // failure
            jive.logger.error('error refreshing access token for ', instance, result);
            deferred.reject(result);
        }
    );

    return deferred.promise;
};

exports.getExternalProps = function( instance ) {
    return pusher.fetchExtendedProperties( instance );
};

exports.setExternalProps = function( instance, props ) {
    return pusher.pushExtendedProperties( instance, props );
};

exports.deleteExternalProps = function( instance ){
    return pusher.removeExtendedProperties( instance );
};
