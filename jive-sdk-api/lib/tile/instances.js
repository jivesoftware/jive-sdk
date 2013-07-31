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
var jive = require('../../api');
var jiveUtil = jive.util;
var jiveClient = require('./client');
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
    return jive.context.persistence;
};

exports.getCollection = function() {
    throw 'Must be subclassed';
};

exports.save = function (instance) {
    if (!instance.id) {
        instance.id = jive.util.guid();
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

var findCredentials = function(jiveUrl) {
    var deferred = q.defer();
    var conf = jive.context.config;
    var serviceCredentials = {
        'clientId': conf.clientId,
        'clientSecret': conf.clientSecret
    };

    if ( jiveUrl) {
        // try to resolve trust by jiveUrl
        jive.community.findByJiveURL( jiveUrl ).then( function(credentials) {
            if( credentials ) {
                deferred.resolve( credentials );
            } else {
                // could not find community trust
                deferred.resolve( serviceCredentials );
            }
        });
    } else {
        deferred.resolve(serviceCredentials);
    }

    return deferred.promise;
};

var doRegister = function(options, pushUrl, config, name, jiveUrl, deferred) {
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
            instance['jiveCommunity'] = jiveUrl ?
                jive.community.parseJiveCommunity(jiveUrl)
              : decodeURIComponent(scope.split(/:/)[1].split('/')[0]).split(/:/)[0];

            deferred.resolve( instance );
        },

        // failure
        function(err) {
            jive.logger.error("Failed access token exchange!", err);
            deferred.reject( err );
        }
    );
};

exports.register = function (jiveUrl, pushUrl, config, name, code ) {
    var deferred = q.defer();

    return findCredentials(jiveUrl).then( function(credentials) {

        // default to global clientID/secret
        var clientId = credentials['clientId'];
        var clientSecret = credentials['clientSecret'];

        var options = {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            jiveUrl: jiveUrl
        };

        doRegister(options, pushUrl, config, name, jiveUrl, deferred );

        return deferred.promise;
    });
};

function doRefreshAccessToken(options, instance, deferred) {
    jiveClient.refreshAccessToken(options,
        function (response) {
            if (response.statusCode >= 200 && response.statusCode <= 299) {
                var accessTokenResponse = response['entity'];

                // success
                instance['accessToken'] = accessTokenResponse['access_token'];
                instance['expiresIn'] = accessTokenResponse['expires_in'];
                instance['refreshToken'] = accessTokenResponse['refresh_token'];
                deferred.resolve(instance);
            } else {
                jive.logger.error('error refreshing access token for ', instance);
                deferred.reject(response);
            }
        }, function (result) {
            // failure
            jive.logger.error('error refreshing access token for ', instance, result);
            deferred.reject(result);
        }
    );
}
exports.refreshAccessToken = function (instance) {
    var deferred = q.defer();
    var jiveCommunity = instance['jiveCommunity'];

    // default
    var options = {
        client_id: jive.context.config['clientId'],
        refresh_token: instance['refreshToken']
    };

    if ( !jiveCommunity ) {
        doRefreshAccessToken(options, instance, deferred);
    } else {
        jive.community.findByCommunity( jiveCommunity).then( function(community) {
            if ( community ) {
                options['client_id'] = community['clientId'];
                doRefreshAccessToken(options, instance, deferred);
            } else {
                // could not find community trust
                doRefreshAccessToken(options, instance, deferred);
            }
        });
    }

    return deferred.promise;
};

exports.getExternalProps = function( instance ) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.GET_EXTERNAL_PROPS, {
        'instance' : instance
    } );
};

exports.setExternalProps = function( instance, props ) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.SET_EXTERNAL_PROPS, {
        'instance' : instance,
        'props' : props
    } );
};

exports.deleteExternalProps = function( instance ){
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.DELETE_EXTERNAL_PROPS, {
        'instance' : instance
    } );
};
