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
 * These are global, publically available endpoints useful in the administration of the service
 * tiles, tile definitions, and other concerns.
 */

var url = require('url');
var q = require('q');
var jive = require("../api");
var dev = require('./dev');

exports.unregister = function( req, res ) {
    var conf = jive.service.options;
    var clientId = conf.clientId;
    var secret = conf.clientSecret;
    var name = req.body['name'];
    var jiveUrl = req.body['jiveUrl'];
    var remoteTileId = req.body['id'];

    // xxx todo - remove the tile instance
    console.log("Unregister!!") ;
};

var findCredentials = function(jiveUrl) {
    var deferred = q.defer();
    var conf = jive.service.options;

    // default to system credentials
    var credentials = {
        'clientId': conf.clientId,
        'clientSecret': conf.clientSecret
    };

    if ( !jiveUrl) {
        // default to service credentials -- cannot look it up by community
        deferred.resolve( credentials );
    } else {
        // try to resolve trust by jiveUrl
        jive.community.findByJiveURL( jiveUrl).then( function(community) {
            if ( community ) {
                credentials['clientId'] = community['clientId'];
                credentials['clientSecret'] = community['clientSecret'];
            }
            deferred.resolve( credentials );
        }) ;
    }

    return deferred.promise;
};

//only thing this should do inline is validating credentials
exports.registration = function( req, res ) {
    var pushUrl = req.body['url'];
    // xxx todo save remoteTileId along with the tile instance (so it can be unregistered, see above)
    var remoteTileId = req.body['id'];
    var guid = req.body['guid'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];
    var jiveUrl = req.body['jiveUrl'];

    findCredentials(jiveUrl).then( function(credentials) {
        if ( credentials ) {
            var clientId = credentials['clientId'];
            var secret = credentials['clientSecret'];
            var auth = req.headers['authorization'];

            if ( !jive.util.basicAuthorizationHeaderValid(auth, clientId, secret ) ) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end( JSON.stringify( { 'status': 403, 'error': 'Invalid or missing HMAC authorization header' } ) );
                return;
            }

            schedule(guid, config, name, jiveUrl, pushUrl, code, res);
        } else {
            // problem!
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify( { 'status': 403, 'error': 'Invalid or missing HMAC authorization header' } ) );
        }
    });
};

function makeContext(guid, config, name, jiveUrl, pushUrl, code) {
    return {
        'guid':guid,
        'config':config,
        'name':name,
        'jiveUrl':jiveUrl,
        'pushUrl':pushUrl,
        'code':code
    }
}

function schedule(guid, config, name, jiveUrl, pushUrl, code, res) {
    var promise = jive.context.scheduler.schedule('registration', makeContext(guid, config, name, jiveUrl, pushUrl, code));
    var success = function (result) {
        res.writeHead(200);
        res.end(JSON.stringify(result));
    };
    var fail = function (result) {
        var status = result.status || 500;
        res.writeHead(status);
        res.end(JSON.stringify(result));
    };
    promise.then(success, fail);
}