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
var tileRegistry = require('../tile/registry');
var q = require('q');
var jive = require("../api");
var dev = require('./dev');

// xxx todo - add oauth2 support end points here

exports.registration = function( req, res ) {
    var conf = jive.setup.options;
    var clientId = conf.clientId;
    var url = req.body['url'];
    var guid = req.body['guid'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];

    var auth = req.headers['authorization'];
    if (auth && auth.indexOf('Basic ') == 0 ) {
        var authParts = auth.split('Basic ');
        var p = new Buffer(authParts[1], 'base64').toString();
        var pParts = p.split(':');
        var authClientId = pParts[0];
        var authSecret = pParts[1];

        if ( authClientId !== clientId || authSecret !== authSecret ) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify( { 'error': 'Invalid HMAC authorization header' } ) );
            return;
        }
    }

    var registerer = function( scope, instanceLibrary ) {
        instanceLibrary.findByScope(guid).then( function(tileInstance) {
            // the instance exists
            // update the config only
            if ( tileInstance ) {
                // update the config
                tileInstance['config'] = config;

                instanceLibrary.save(tileInstance).then(function() {
                    tileRegistry.emit("updateInstance." + name, tileInstance);
                });
            } else {
                instanceLibrary.register(clientId, url, config, name, code).then(
                    function( tileInstance ) {
                        console.log("registered instance", tileInstance );
                        instanceLibrary.save(tileInstance).then(function() {
                            tileRegistry.emit("newInstance." + name, tileInstance);
                        });
                    }
                );
            }
        });

    };

    // try tiles
    jive.tiles.definitions.findByTileName( name).then( function( found ) {
        if ( found ) {
            registerer(guid, jive.tiles);
        }
    });

    // try extstreams
    jive.extstreams.definitions.findByTileName( name).then( function( found ) {
        if ( found ) {
            registerer(guid, jive.extstreams);
        }
    });

    // todo -- what if it isn't? err???
    res.status(204);
    res.set({'Content-Type': 'application/json'});
    res.send();
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// development routes

exports.tiles = dev.tiles;
exports.installTiles = dev.installTiles;
exports.requestCredentials = dev.requestCredentials;
