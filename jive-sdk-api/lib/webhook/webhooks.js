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

var jive = require('../../api');
var q = require('q');

/**
 * API for interacting with Jive communities.
 * @module webhooks
 */

/**
 * Saves the given webhook into persistence.
 * @param webhook
 * @returns {Promise} Promise
 */
exports.save = function( webhook ) {
    return jive.context.persistence.save( "webhook", webhook['id'], webhook );
};

/**
 * Looks through persistence for a webhook object with the provided id.
 * If no object is found with that id, a null object is resolved to the returned promise.
 * @param webhookId
 * @returns {Promise} Promise
 */
exports.findByID = function( webhookId ) {
    return jive.context.persistence.findByID( 'webhook', webhookId );
};

/**
 * Looks through persistence for any webhook objects related to the provided tenantId.
 * <br><br>
 * An error will be thrown if, tenantId is not found in the webhook persistence store.
 * <br><br>
 * @param tenantId
 * @returns {Promise} Promise (webhook)
 */
exports.findByTenantID = function (tenantId) {
    var deferred = q.defer();

    jive.context.persistence.find( 'webhook', { 'tenantId' : tenantId } ).then( function(found) {
        deferred.resolve(found);
    }, function(error) {
        deferred.reject(error);
    });

    return deferred.promise;
};

/**
 * Looks through persistence for a webhook object with the provided webhookURL.
 * <br><br>
 * An error will be thrown if, webhookURL is not found in the webhook persistence store.
 * <br><br>
 * @param webhookURL
 * @returns {Promise} Promise (webhook)
 */
exports.findByWebhookURL = function (webhookURL) {
    var deferred = q.defer();

    jive.context.persistence.find( 'webhook', { 'entity.resources.self.ref' : webhookURL }).then( function(found) {
        deferred.resolve(found);
    }, function(error) {
        deferred.reject(error);
    });

    return deferred.promise;
};

/**
 * Uses a webhook object to resolve reference to its parent community.  This is a convenience method for webhook processing.
 * <br><br>
 * An error will be thrown if, community tenantId is not found in the community persistence store.
 * <br><br>
 * @param webhook object
 * @returns {Promise} Promise (community)
 */
exports.findWebhookCommunity = function (webhook) {
    var deferred = q.defer();

    jive.community.findByTenantID(webhook['tenantId']).then(
        function(community) {
            deferred.resolve(community);
        },
        function(error) {
            deferred.reject(error);
        }
    );

    return deferred.promise;
};


/**
 * Looks through persistence for all webhooks associated with the provided community object.
 * If no objects are found with that id, an empty array is resolved to the returned promise; otherwise an
 * array of objects is resolved.
 * <br><br>
 * An error will be thrown if:
 * <ul>
 *     <li>No community argument is passed</li>
 *     <li>Community argument is not an object</li>
 *     <li>Community object does not contain a tenantId</li>
 * </ul>
 * @param community
 * @returns {Promise} Promise
 */
exports.findByCommunity = function(community) {
    if ( !community ) {
        throw new Error("Community object is required.");
    }

    if ( typeof community !== 'object') {
        throw new Error("Community must be an object.");
    }

    if ( !community['tenantId'] ) {
        throw new Error("Community object must contain a tenantId.");
    }

    var deferred = q.defer();

    var tenantId = community['tenantId'];
    jive.context.persistence.find( 'webhook', { 'tenantId' : tenantId } ).then( function(found) {
        deferred.resolve(found);
    }, function(error) {
        deferred.reject(error);
    });

    return deferred.promise;
};

/**
 * Register a webhook for the named jive community. Uses either the registered community access token for your
 * service, or the supplied access token.
 * @param {String} jiveCommunity Required. Name of the jive community.
 * @param {Array} events Required. Array of String. Elements may be system webhooks (user_account, user_membership, user_session, social_group)
 * or content events (document, discussion, blogpost, .. )
 * @param {String} object Optional, if events are system webhooks.
 * @param {String} webhookCallbackURL Required. URL of the postback that Jive will contact when the conditions of the hook are met.
 * @param {String} accessToken Optional. If omitted, will registration will use community oauth
 * @param {String} refreshToken Optional. If omitted, will registration will use community oauth
 * @param {function} tokenPersistenceFunction Optional. Callback function that will be invoked with new oauth access and refresh
 * tokens ({'access_token' : '...', 'refresh_token' : '...' }). If not provided, the community will be updated with the new access tokens.
 * @returns {Promise} Promise
 */
exports.register = function( jiveCommunity, events, object, webhookCallbackURL,
                             accessToken, refreshToken, tokenPersistenceFunction ) {
    var deferred = q.defer();

    var self = this;

    jive.community.findByCommunity(jiveCommunity).then( function(community) {
        if ( community ) {

            var webhookRequest = {
                "events": events,
                "object": object,
                "callback": webhookCallbackURL
            };

            if ( (!community['oauth'] || !community['oauth']['access_token']) && !accessToken ) {
                deferred.reject(new Error("Failed to create community webhook. " +
                    "No access token associated with community, and none provided explicitly."));
                return;
            }

            var oauth;
            if ( accessToken ) {
                oauth = {};
                oauth['access_token'] = accessToken;
                oauth['refresh_token'] = refreshToken;
            }

            jive.community.doRequest( community, {
                'path' : '/api/core/v3/webhooks',
                'oauth' : oauth,
                'tokenPersistenceFunction' : tokenPersistenceFunction,
                'method' : 'POST',
                'postBody' : webhookRequest
            }).then(
                function(result) {
                    // success
                    // save the webhook
                    var id = jive.util.guid();
                    var webhook = {
                        'id' : id,
                        'tenantId' : community['tenantId'],
                        'entity' : result['entity']
                    };

                    self.save( webhook ).then( function() {
                        deferred.resolve( result );
                    }, function(error) {
                        deferred.reject(error);
                    });
                },
                function(error) {
                    // failed webhook request
                    deferred.reject( error );
                }
            );
        } else {
            deferred.reject( { "error" : "No such jive community " + jiveCommunity} );
        }
    });

    return deferred.promise;
};

/**
 * Unregisters a webhook . Uses either the registered  access token for the community associated with the webhook or the supplied access token.
 *
 * @param {Object} webhook Required.
 * @param {String} accessToken Optional. If omitted, will registration will use community oauth
 * @param {String} refreshToken Optional. If omitted, will registration will use community oauth
 * @param {function} tokenPersistenceFunction Optional. Callback function that will be invoked with new oauth access and refresh
 * tokens ({'access_token' : '...', 'refresh_token' : '...' }). If not provided, the community will be updated with the new access tokens.
 * @returns {Promise} Promise
 */
exports.unregister = function(webhook, accessToken, refreshToken, tokenPersistenceFunction) {
    var deferred = q.defer();

    jive.community.findByTenantID(webhook.tenantId).then(function(community) {
        if (!community) {
            deferred.reject( { "error" : "Cannot find jive community associated with webhook " + webhook.tenantId} );
            return;
        }

        if ( (!community['oauth'] || !community['oauth']['access_token']) && !accessToken ) {
            deferred.reject(new Error("Failed to create community webhook. " +
                "No access token associated with community, and none provided explicitly."));
            return;
        }

        var oauth;
        if ( accessToken ) {
            oauth = {};
            oauth['access_token'] = accessToken;
            oauth['refresh_token'] = refreshToken;
        }

        jive.community.doRequest( community, {
            'path' : '/api/core/v3/webhooks/'+webhook.entity.id,
            'oauth' : oauth,
            'tokenPersistenceFunction' : tokenPersistenceFunction,
            'method' : 'DELETE'
        }).then(
            function(result) {

                jive.context.persistence.remove('webhook', webhook['id']).then(function(removed) {
                    if (removed) {
                        deferred.resolve();
                    } else {
                        deferred.reject(new Error('Could not remove webhook'+webhook));
                    }
                });

            },
            function(error) {
                // failed webhook request
                deferred.reject( error );
            }
        );

    });

    return deferred.promise;
};