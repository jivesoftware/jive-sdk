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

exports.registration = function( req, res ) {
    var conf = jive.service.options;
    var clientId = conf.clientId;
    var secret = conf.clientSecret;
    var url = req.body['url'];
    var guid = req.body['guid'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];
    console.log(req.body);

    var auth = req.headers['authorization'];
    if ( !jive.util.basicAuthorizationHeaderValid(auth, clientId, secret ) ) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end( JSON.stringify( { 'status': 403, 'error': 'Invalid or missing HMAC authorization header' } ) );
        return;
    }

    var registerer = function( scope, instanceLibrary ) {
        var deferred = q.defer();

        instanceLibrary.findByScope(guid).then( function(tileInstance) {
            // the instance exists
            // update the config only
            if ( tileInstance ) {
                // update the config
                tileInstance['config'] = config;

                instanceLibrary.save(tileInstance).then(function() {
                    jive.events.emit("updateInstance." + name, tileInstance);
                    res.writeHead(204, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify(tileInstance));
                    deferred.resolve();
                });

            } else {
                return instanceLibrary.register(url, config, name, code).then(
                    function( tileInstance ) {
                        jive.logger.info("registered instance", tileInstance );
                        instanceLibrary.save(tileInstance).then(function() {
                            jive.events.emit("newInstance." + name, tileInstance);
                            res.writeHead(201, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify(tileInstance));

                            var jiveCommunity = tileInstance['jiveCommunity'];
                            if ( jiveCommunity ) {
                                jive.service.persistence().save( "community", jiveCommunity, {
                                    'jiveCommunity': jiveCommunity
                                }).then( function() {
                                    deferred.resolve();
                                });
                            } else {
                                deferred.resolve();
                            }
                        });

                    },
                     function(err) {
                        jive.logger.error('Registration failure for', scope);
                        jive.logger.debug(scope, err);
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        var statusObj = { status: 500, 'error': 'Failed to get acquire access token', 'detail' : err };
                        var body = JSON.stringify( statusObj );
                        res.end( body );
                        deferred.reject();
                     } );
            }
        });

        return deferred.promise;
    };

    // try tiles
    var tile;
    var stream;
    q.all([ jive.tiles.definitions.findByTileName( name).then( function(found ) { tile = found; }),
            jive.extstreams.definitions.findByTileName( name ).then( function(found ) { stream = found; }) ] ).then(

        function() {
            if ( tile ) {
                // register a tile instance
                registerer(guid, jive.tiles);
            } else if ( stream ) {
                // register an external stream instance
                registerer(guid, jive.extstreams);
            } else {
                // its neither tile nor externalstream, so return error
                var statusObj = {
                    status: 400,
                    message: "No tile or external stream definition was found for the given name '" + name + "'"
                };
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end( JSON.stringify(statusObj) );
            }
        }
    );
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// development routes

exports.tiles = dev.tiles;
exports.installTiles = dev.installTiles;
