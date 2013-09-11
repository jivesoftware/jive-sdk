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

    if ( !jiveUrl && authorization ) {
        // check authorization header
        var authVars = authorization.split(' ');
        if ( authVars[0] == 'JiveEXTN') {
            // try to parse out jiveURL
            var str = '';
            var authParams = authVars[1].split('&');
            authParams.forEach( function(p) {
                if (p.indexOf('jive_url') == 0 ) {
                    jiveUrl = decodeURIComponent( p.split("=")[1] );
                }
            });
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
            }
            deferred.resolve(credentials);
        });
    }

    return deferred.promise;
};

exports.checkAuthHeaders = function (req, res,next) {

    findCredentials(req).then( function(credentials) {
        if ( credentials ) {
            var clientId = credentials['clientId'];
            var secret = credentials['clientSecret'];
            var auth = req.headers['authorization'];

            if ( !jive.util.basicAuthorizationHeaderValid(auth, clientId, secret ) ) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end( JSON.stringify( { 'status': 403, 'error': 'Invalid or missing HMAC authorization header' } ) );
            }

            if ( !jive.util.jiveAuthorizationHeaderValid(auth, clientId, secret ) ) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end( JSON.stringify( { 'status': 403, 'error': 'Invalid or missing HMAC authorization header' } ) );
            }
        } else {
            // problem!
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify( { 'status': 403, 'error': 'Invalid or missing HMAC authorization header' } ) );
        }
    }).finally( function() {
        next();
    })

};