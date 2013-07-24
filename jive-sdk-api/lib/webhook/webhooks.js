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
    return jive.context.persistence.save( "webhook", webhook['url'], webhook );
};

exports.register = function( jiveCommunity, events, object, webhookCallback ) {
    var deferred = q.defer();

    jive.community.findByCommunity(jiveCommunity).then( function(community) {
        if ( community ) {

            var webhookRequest = {
                "events": events,
                "object": object,
                "callback": webhookCallback
            };

            var access_token = community['oauth']['access_token'];
            var jiveUrl = community['jiveUrl'];
            var webhooksEndpoint = jiveUrl + '/api/core/v3/webhooks';

            var headers = {
                'Authorization' : 'Bearer ' + access_token
            };

            jive.util.buildRequest(webhooksEndpoint, "POST", webhookRequest, headers).then(
                function(result) {
                    deferred.resolve( result );
                },
                function(error) {
                    deferred.reject( error );
                }
            );
        } else {
            deferred.reject( { "error" : "No such jive community"} );
        }
    });

    return deferred.promise;
};
