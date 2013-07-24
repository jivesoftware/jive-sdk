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
var client = require('./../tile/client');

var returnOne = function(found ) {
    if ( found == null || found.length < 1 ) {
        return null;
    } else {
        // return first one
        return found[0];
    }
};

exports.save = function(community ) {
    var jiveUrl = community['jiveUrl'];
    var jiveCommunity = community['jiveCommunity'];
    if ( !jiveCommunity ) {
        community['jiveCommunity'] = exports.parseJiveCommunity(jiveUrl);
    }

    return jive.context.persistence.save( "community", community['jiveUrl'], community );
};

exports.find = function( filter, expectOne ) {
    return jive.context.persistence.find("community", filter).then( function( found ) {
        return expectOne ? returnOne( found ) : found;
    } );
};

exports.findByJiveURL = function( jiveUrl ) {
    return exports.find( {
        'jiveUrl' : jiveUrl
    }, true );
};

exports.findByCommunity = function( jiveCommunity ) {
    return exports.find( {
        'jiveCommunity' : jiveCommunity
    }, true );
};

exports.parseJiveCommunity = function( jiveUrl ) {
    var parts = jiveUrl.split('http')[1].split('\/\/')[1].split(':')[0].split('/')[0].split('www.');
    return parts.length > 1 ? parts[1] : parts[0];
};

exports.register = function( registration ) {
    var deferred = q.defer();
    var jiveSignature = registration['jiveSignature'];

    // xxx todo - validate jiveSignature, then do access token exchange

    var registrationToSave = JSON.parse( JSON.stringify(registration) );

    var authorizationCode = registration['code'];
    var scope = registration['scope'];
    var tenantId = registration['tenantId'];
    var jiveUrl = registration['jiveUrl'];
    var clientId = registration['clientId'];
    var clientSecret = registration['clientSecret'];

    if ( !clientId ) {
        // use global one
        clientId = jive.context.config['clientId'];
    }
    if ( !clientSecret ) {
        // use global one
        clientSecret = jive.context.config['clientSecret'];
    }

    // do access token exchange
    client.requestAccessToken(
        {
            'client_secret' : clientSecret,
            'client_id' : clientId,
            'code' : authorizationCode,
            'jiveUrl' : jiveUrl,
            'scope' : scope,
            'tenantId' : tenantId
        },

        function(response) {
            // successfully exchanged for access token:
            // save registration

            exports.findByCommunity( jiveUrl ).then( function(community) {
                community = community || {};

                var oauth = community['oauth'] || response['entity'];
                oauth['code'] = authorizationCode || oauth['code'];
                oauth['jiveSignature'] = jiveSignature || oauth['jiveSignature'];
                oauth['scope'] = response['entity']['scope'] || oauth['scope'];
                oauth['expiresIn'] = response['entity']['expires_in'] || oauth['expiresIn'];
                oauth['accessToken'] = response['entity']['access_token'] || oauth['accessToken'];

                community['jiveUrl' ] = jiveUrl || community['jiveUrl' ] ;
                community['version' ] = 'post-samurai';
                community['tenantId' ] = tenantId || community['tenantId' ];
                community['clientId' ] = clientId || community['clientId' ];
                community['clientSecret' ] = clientSecret || community['clientSecret' ];
                community[ 'oauth' ] = oauth;

                exports.save( community ).then(
                    function() {
                        // successful save:
                        // emit a registration saved event and resolve
                        jive.events.emit("registeredJiveInstanceSuccess", community);
                        deferred.resolve();
                    },
                    function(error) {
                        // error saving
                        jive.events.emit("registeredJiveInstanceFailed", community );
                        deferred.reject(error);
                    }
                );
            });

        },

        function(error) {
            // failed to exchange for access token
            jive.events.emit("registeredJiveInstanceFailed", registrationToSave);
            deferred.reject( error );
        }
    );

    return deferred.promise;
};
