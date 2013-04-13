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

// xxx todo - add authz checking here

exports.registration = function( req, res ) {
    var conf = jive.config.fetch();
    var clientId = conf.clientId;
    var url = req.body['url'];
    var guid = req.body['guid'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];

    var registerer = function( instanceLibrary ) {
        instanceLibrary.findByScope().execute( function(tileInstance) {
            // the instance exists
            // update the config only
            if ( tileInstance ) {
                // update the config
                tileInstance['config'] = config;

                instanceLibrary.save(tileInstance).execute(function() {
                    tileRegistry.emit("updateInstance." + name, tileInstance);
                });
            } else {
                instanceLibrary.register(clientId, url, config, name, code).execute(
                    function( tileInstance ) {
                        console.log("registered instance", tileInstance );
                        instanceLibrary.save(tileInstance).execute(function() {
                            tileRegistry.emit("newInstance." + name, tileInstance);
                        });
                    }
                );
            }
        });

    };

    // try tiles
    jive.tiles.definitions.findByTileName( name).execute( function( found ) {
        if ( found ) {
            registerer(jive.tiles);
        }
    });

    // try extstreams
    jive.extstreams.definitions.findByTileName( name).execute( function( found ) {
        if ( found ) {
            registerer(jive.extstreams);
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
