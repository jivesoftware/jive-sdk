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

exports.findByTenantID = function( tenantID ) {
    return exports.find( {
        'tenantId' : tenantID
    }, true );
};

exports.parseJiveCommunity = function( jiveUrl ) {
//    var parts = jiveUrl.split('http')[1].split('\/\/')[1].split(':')[0].split('/')[0].split('www.');
    var parts = require('url').parse(jiveUrl).host.split('www.');

    return parts.length > 1 ? parts[1] : parts[0];
};


/**
 * Make a request to the current community.
 *
 * @param community
 * @param options
 * @returns {*}
 */
exports.doRequest = function( community, options ) {
    options = options || {};
    var path = options.path,
        headers = options.headers || {},
        oauth = options.oauth || community.oauth,
        jiveUrl = community.jiveUrl;

    if( !oauth ) {
        jive.logger.info("No oauth credentials found.  Continuing without them.");
    }

    if( path.charAt(0) !== '/' ) {
        // ensure there a starting /
        path = "/" + path;
    }

    if( jiveUrl.slice(-1) === '/') {
        // Trim the last /
        jiveUrl = jiveUrl.slice(0, -1);
    }

    var url = jiveUrl + path;

    if(oauth) {
        headers.Authorization = 'Bearer ' + oauth['access_token'];
    }

    return jive.util.buildRequest( url, options.method, options.postBody, headers, options.requestOptions );
};

function validateRegistration(registration) {

    if ( jive.context.config['development'] == true ) {
        jive.logger.warn("Warning - development mode is on. Accepting extension registration request regardless of source!");
        return q.resolve(true);
    }

    var validationBlock = JSON.parse( JSON.stringify(registration) );
    var jiveSignature = validationBlock['jiveSignature'];
    var clientSecret = validationBlock['clientSecret'];
    var jiveSignatureUrl = validationBlock['jiveSignatureURL'];
    delete validationBlock['jiveSignature'];

    var crypto = require("crypto");
    var sha256 = crypto.createHash("sha256");
    sha256.update(clientSecret, "utf8");
    validationBlock['clientSecret'] = sha256.digest("hex");

    var buffer = '';

    validationBlock = jive.util.sortObject(validationBlock);
    for (var key in validationBlock) {
        if (validationBlock.hasOwnProperty(key)) {
            var value = validationBlock[key];
            buffer += key + ':' + value + '\n';
        }
    }

    var headers = {
        'X-Jive-MAC' : jiveSignature
    };

    jive.logger.debug("Received registration block: " + JSON.stringify(validationBlock) );
    jive.logger.debug("Shipping validation request to appsmarket - endpoint: " + jiveSignatureUrl );

    return jive.util.buildRequest(jiveSignatureUrl, 'POST', buffer, headers);
}

exports.register = function( registration ) {
    var deferred = q.defer();

    validateRegistration(registration).then(
        // success
        function() {
            var registrationToSave = JSON.parse( JSON.stringify(registration) );

            jive.logger.debug("Successful registration request, proceeding.");

            var jiveSignature = registration['jiveSignature'];
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
            function persistCommunity(oauthResponse) {
                exports.findByJiveURL(jiveUrl).then(function (community) {
                    community = community || {};

                    var oauth;
                    if ( oauthResponse ) {
                        oauth = community['oauth'] || oauthResponse['entity'];
                        oauth['code'] = authorizationCode || oauth['code'];
                        oauth['jiveSignature'] = jiveSignature || oauth['jiveSignature'];
                        oauth['scope'] = oauthResponse['entity']['scope'] || oauth['scope'];
                        oauth['expiresIn'] = oauthResponse['entity']['expires_in'] || oauth['expiresIn'];
                        oauth['accessToken'] = oauthResponse['entity']['access_token'] || oauth['accessToken'];
                    }

                    community['jiveUrl' ] = jiveUrl || community['jiveUrl' ];
                    community['version' ] = 'post-samurai';
                    community['tenantId' ] = tenantId || community['tenantId' ];
                    community['clientId' ] = clientId || community['clientId' ];
                    community['clientSecret' ] = clientSecret || community['clientSecret' ];

                    if ( oauth ) {
                        community[ 'oauth' ] = oauth;
                    }

                    exports.save(community).then(
                        function () {
                            // successful save:
                            // emit a registration saved event and resolve
                            jive.events.emit("registeredJiveInstanceSuccess", community);
                            deferred.resolve();
                        },
                        function (error) {
                            // error saving
                            jive.events.emit("registeredJiveInstanceFailed", community);
                            deferred.reject(error);
                        }
                    );
                });
            }

            if ( authorizationCode ) {
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
                        persistCommunity(response);
                    },

                    function(error) {
                        // failed to exchange for access token
                        jive.events.emit("registeredJiveInstanceFailed", registrationToSave);
                        deferred.reject( error );
                    }
                );
            } else {
                persistCommunity();
            }
        },

        // error
        function(err) {
            jive.logger.debug("Unsuccessful registration request: " + err? JSON.stringify(err) : '');
            jive.events.emit("registeredJiveInstanceFailed", err );
            deferred.reject(new Error("Failed jive signature validation: "
                + JSON.stringify(err)));
        }
    );

    return deferred.promise;
};
