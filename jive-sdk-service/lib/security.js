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
 * @module security
 */

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var express = require('express'),
    service = require('./service'),
    jive = require('../api'),
    q = require('q');

var findCredentials = function(req) {
    var deferred = q.defer();
    var conf = jive.service.options;

    // try to get it from body
    var jiveUrl = req.body['jiveUrl'];

    // default to system credentials
    var credentials = {
        'clientId': conf.clientId,
        'clientSecret': conf.clientSecret
    };

    var authorization = req.headers['authorization'];
    var tenantID;

    if ( !jiveUrl && authorization ) {
        jive.logger.debug("Trying to parse jiveURL/tenantID from JiveEXTN authorization header...");

        // check authorization header
        var authVars = authorization.split(' ');
        req['jive'] = {};
        if ( authVars[0] == 'JiveEXTN') {
            // try to parse out jiveURL
            var authParams = authVars[1].split('&');
            authParams.forEach( function(p) {
                if (p.indexOf('jive_url') == 0 ) {
                    jiveUrl = decodeURIComponent( p.split("=")[1] );
                    req['jive']['jiveURL'] = jiveUrl;
                }
                if (p.indexOf('tenant_id') == 0 ) {
                    tenantID = decodeURIComponent( p.split("=")[1] );
                    req['jive']['tenantID'] = tenantID;
                }
            });
        } else {
            jive.logger.debug("JiveEXTN authorization header not present, could not find jiveURL that way.");
        }
    }

    if ( !jiveUrl ) {
        // default to service credentials -- cannot look it up by community
        deferred.resolve( credentials );
    } else {
        // try to resolve trust by jiveUrl
        jive.community.findByJiveURL(jiveUrl).then(function (community) {
            if (community) {
                credentials['clientId'] = community['clientId'];
                credentials['clientSecret'] = community['clientSecret'];
            } else {
                jive.logger.debug("Could not look up security credentials by community jiveURL " + jiveUrl + " -- using service credentials " +
                    "from service configuration file (usually jiveclientconfiguration.json).");
            }
            deferred.resolve(credentials);
        });
    }

    return deferred.promise;
};

var lockedRoutes = {};

/**
 * Any routes passed into this method will become locked: e.g the service will validate security headers.
 * @param routePath
 */
exports.lockRoute = function( routePath ) {
    // pre
    if ( !routePath) {
        return;
    }

    if ( !routePath['verb'] ) {
        throw new Error('Invalid route, cannot lock: missing verb');
    }

    if ( !routePath['path'] ) {
        throw new Error('Invalid route, cannot lock: missing path');
    }

    var key = routePath['verb'] + '.' + routePath['path'];
    lockedRoutes[key] = routePath;
};

exports.getLockedRoutes = function() {
    // return immutable copy
    return JSON.parse( JSON.stringify( lockedRoutes ) );
};

exports.isLocked = function( req ) {
    // in development, we're not locked down
    if ( jive.service.isDevelopment() ) {
        return false;
    }

    var key = req.method.toLowerCase() + '.' + req.path;
    return lockedRoutes[key];
};

function invalidAuthResponse(res) {
    if ( !res ) {
        return;
    }

    // bad
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 'status': 403, 'error': 'Invalid or missing authorization headers.' }));
}

/**
 * General purpose utility that checks the request for security headers and validates them.
 * If error, a 403 response will be added to the passed in res object (if available)
 * @param req
 * @param res optional
 */
exports.checkAuthHeaders = function(req, res) {
    var deferred = q.defer();

    if ( !exports.isLocked(req) ) {
        // we're ok
        deferred.resolve(true);
    } else {
        findCredentials(req).then( function(credentials) {
            if ( credentials ) {
                var clientId = credentials['clientId'];
                var secret = credentials['clientSecret'];
                var auth = req.headers['authorization'];

                if ( !auth ) {
                    jive.logger.debug("No security headers found, even though security credentials were required.");
                    invalidAuthResponse(res);
                    deferred.reject(false);
                    return;
                }

                var passedBasic  =  jive.util.basicAuthorizationHeaderValid(auth, clientId, secret, true );
                var passedJiveEXTN = jive.util.jiveAuthorizationHeaderValid(auth, clientId, secret, true );

                if ( !passedBasic && !passedJiveEXTN ) {
                    jive.logger.debug("Unauthorized access. Failed basic auth, and jiveEXTN header checks.");
                    invalidAuthResponse(res);
                    deferred.reject(false);
                    return;
                }

                // we're ok
                deferred.resolve(true);
            } else {
                jive.logger.debug("No credentials were found to check against.");
                deferred.resolve(true);
            }
        });
    }

    return deferred.promise;
};

exports.checkAuthHeadersMiddleware = function (req, res, next ) {
    return exports.checkAuthHeaders( req, res ).finally( function() {
        if ( next && !res.headersSent) {
            next();
        }
    });
};