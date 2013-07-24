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
var jive = require('../api');
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

var doRegister = function(options, pushUrl, config, name, jiveUrl, tenantId, deferred) {
    // instance to save
    var instance = {
        url: pushUrl,
        config: config,
        name: name
    };

    jive.service.community.findByTenantIDorJiveURL(tenantId, jiveUrl).then( function(community) {
        return community;
    }).then( function(community) {
        // if there is a community, then tie the instance to the communtiy, and do not do access token request
        if ( community ) {
            instance['jiveCommunity'] = community['jiveCommunity'];
            deferred.resolve( instance );
        } else {
            jiveClient.requestAccessToken(options,
                // success
                function (response) {
                    jive.logger.debug("Reached Access Token Exchange callback", response);
                    var accessTokenResponse = response['entity'];
                    var scope = accessTokenResponse['scope'];

                    instance['accessToken'] = accessTokenResponse['access_token'];
                    instance['expiresIn'] = accessTokenResponse['expires_in'];
                    instance['refreshToken'] = accessTokenResponse['refresh_token'];
                    instance['scope'] = scope;
                    instance['jiveCommunity'] = jiveUrl ?
                        jive.service.community.parseJiveCommunity(jiveUrl)
                        : decodeURIComponent(scope.split(/:/)[1].split('/')[0]).split(/:/)[0];

                    deferred.resolve( instance );
                },

                // failure
                function(err) {
                    jive.logger.error("Failed access token exchange!", err);
                    deferred.reject( err );
                }
            );
        }
    });

};

exports.register = function (jiveUrl, pushUrl, tenantId, config, name, code ) {
    var deferred = q.defer();

    return jive.service.community.getApplicableCredentials(jiveUrl, tenantId).then( function(credentials) {
        var options = {
            client_id: credentials['clientId'],
            client_secret: credentials['clientSecret'],
            code: code,
            jiveUrl: jiveUrl
        };

        doRegister(options, pushUrl, config, name, jiveUrl, tenantId, deferred );

        return deferred.promise;
    });
};

function doRefreshAccessToken(options, instance, deferred) {
    jiveClient.refreshAccessToken(options,
        function (response) {
            if (response.statusCode >= 200 && response.statusCode <= 299) {
                var accessTokenResponse = response['entity'];

                var result = {};

                // success
                result['accessToken'] = accessTokenResponse['access_token'];
                result['expiresIn'] = accessTokenResponse['expires_in'];
                result['refreshToken'] = accessTokenResponse['refresh_token'];
                deferred.resolve(result);
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
    var thisLibrary = this;
    var deferred = q.defer();
    var jiveCommunity = instance['jiveCommunity'];

    // default
    var options = {
        client_id: jive.service.options['clientId'],
        refresh_token: instance['refreshToken']
    };

    var doInstanceTokenUpdate = function(options) {
        doRefreshAccessToken(options, instance).then(
            function(result) {
                instance['accessToken'] = result['access_token'];
                instance['expiresIn'] = result['expires_in'];
                instance['refreshToken'] = result['refresh_token'];

                thisLibrary.save(instance).then(function(saved) {
                    deferred.resolve(saved);
                });
            },
            function(error) {
                deferred.reject( error );
            }
        );
    };

    if ( !jiveCommunity ) {
        doInstanceTokenUpdate(options);
    } else {
        jive.service.community.findByCommunity( jiveCommunity).then( function(community) {
            if ( community ) {
                // community trust exists, then use that
                options['client_id'] = community['clientId'];
                if ( community['oauth'] && community['oauth']['refreshToken'] ) {
                    options['refresh_token'] = community['oauth']['refreshToken'];
                    doRefreshAccessToken(options, instance, deferred).then(
                        function(result) {
                            // update community, and save it
                            community['oauth']['accessToken'] = result['accessToken'];
                            community['oauth']['refreshToken'] = result['refreshToken'];
                            community['oauth']['expiresIn'] = result['expiresIn'];
                            jive.service.community.save( community ).then(
                                function() { deferred.resolve(result); },
                                function (error) { deferred.reject(error) }
                            );
                        },
                        function(error) {
                            deferred.reject(error);
                        }
                    );
                } else {
                    // no refresh token -- cannot use community trust
                    doInstanceTokenUpdate(options);
                }
            } else {
                // could not find community trust
                doInstanceTokenUpdate(options);
            }
        });
    }

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
