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
var jiveClient = require('./../client/jive');

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
 * Requests an access token by oauth access code (oauth access code is given in registration requests and valid for few minutes).
 * @param jiveUrl - the url of the jive community. this function will use this url to find the community in the persistence and get the client id and secret.
 * @param oauthCode - the code needed to be use to get access to a specific registration scope (usually a group).
 * @returns a promise for success and failure [use .then(...) and .catch(...)]
 */
exports.requestAccessToken = function (jiveUrl, oauthCode) {
    var defer = q.defer();

    exports.findByJiveURL(jiveUrl)
        .then(function (communityObj) {
            if (communityObj) {
                var oauthConf = {
                    client_id: communityObj.clientId,
                    client_secret: communityObj.clientSecret,
                    code: oauthCode,
                    jiveUrl: jiveUrl
                };
                jiveClient.requestAccessToken(oauthConf, defer.resolve, defer.reject);
            }
            else {
                defer.reject(new Error("No community found by the url: " + jiveUrl));
            }
        })
        .catch(defer.reject);

    return defer.promise;
};

var accessTokenRefresher = function(operationContext, oauth) {
    var community = operationContext['community'];
    var tokenPersistenceFunction = operationContext.tokenPersistenceFunction;

    var d = q.defer();

    var options = {};
    if ( community ) {
        options['client_id'] = community['clientId'];
        options['client_secret'] = community['clientSecret'];
        options['refresh_token'] = oauth['refresh_token'];
        options['jiveUrl'] = community['jiveUrl'];


        jiveClient.refreshAccessToken(options,
            function (response) {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                    var accessTokenResponse = response['entity'];


                    var resolve = function() {
                        d.resolve(accessTokenResponse);
                    };

                    if(tokenPersistenceFunction) {
                        var promise = tokenPersistenceFunction(accessTokenResponse);
                        if(promise) {
                            promise.then(resolve, resolve);
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                } else {
                    jive.logger.error('error refreshing access token for ', community);
                    d.reject(response);
                }
            }, function (result) {
                // failure
                jive.logger.error('error refreshing access token for ', community, result);
                d.reject(result);
            }
        );
    } else {
        d.reject();
    }

    return d.promise;
};

var oAuthHandler;
var getOAuthHandler = function() {
    if ( !oAuthHandler  ) {
        oAuthHandler = jive.util.oauth.buildOAuthHandler(accessTokenRefresher);
    }

    return oAuthHandler;
};

/**
 * Make a request to the current community.
 * Automatically handle access token refresh flow if failure.
 *
 * @param community
 * @param options
 * @returns {*}
 */
exports.doRequest = function( community, options ) {
    options = options || {};
    var path = options.path,
        url = options.url,
        headers = options.headers || {},
        oauth = options.oauth || community.oauth,
        jiveUrl = community.jiveUrl,
        tokenPersistenceFunction = options.tokenPersistenceFunction;

    if ( !url ) {
        // construct from path and jiveURL
        if( path.charAt(0) !== '/' ) {
            // ensure there a starting /
            path = "/" + path;
        }

        if( jiveUrl.slice(-1) === '/') {
            // Trim the last /
            jiveUrl = jiveUrl.slice(0, -1);
        }

        url = jiveUrl + path;
    }

    if (!oauth) {
        jive.logger.info("No oauth credentials found.  Continuing without them.");
        return jive.util.buildRequest( url, options.method, options.postBody, headers, options.requestOptions );
    }

    // oauth
    if (!tokenPersistenceFunction && !options.oauth) {
        tokenPersistenceFunction = function(updatedOAuth) {
            community.oauth = updatedOAuth;
            return exports.save(community);
        };
    }

    headers.Authorization = 'Bearer ' + oauth['access_token'];

    return getOAuthHandler().doOperation(
        // operation
        function(operationContext, oauth) {
            var community = operationContext['community'];
            return exports.findByCommunity(community['jiveCommunity']).then( function( community ) {
                if ( !community ) {
                    return q.reject();
                }
                headers.Authorization = 'Bearer ' + oauth.access_token;
                return jive.util.buildRequest( url, options.method, options.postBody, headers, options.requestOptions );
            });
        },

        // operation context
        {
            'community' : community,
            'tokenPersistenceFunction' : tokenPersistenceFunction
        },

        // oauth
        {
            'access_token' : oauth['access_token'],
            'refresh_token' : oauth['refresh_token']
        }
    );
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
                jiveClient.requestAccessToken(
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
