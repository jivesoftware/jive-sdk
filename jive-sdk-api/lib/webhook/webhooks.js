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

exports.save = function( webhook ) {
    return jive.context.persistence.save( "webhook", webhook['id'], webhook );
};

exports.findByTenantID = function( webhookId ) {
    return jive.context.persistence.findByID( 'webhook', webhookId );
};

exports.findByCommunity = function(community) {
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
 * @param jiveCommunity
 * @param events
 * @param object
 * @param webhookCallbackURL
 * @param accessToken if omitted, will registration will use community oauth
 * @param refreshToken if omitted, will registration will use community oauth
 * @param tokenPersistenceFunction supply this to handle any new oauth tokens acquired after a token refresh
 * @return promise
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
