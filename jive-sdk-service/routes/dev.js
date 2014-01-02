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
 * @module devRoutes
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var url = require('url');
var http = require('http');
var q = require('q');
var jive = require("../api");
var mustache = require('mustache');

/**
 * <b>GET /tiles</b>
 * <br>
 * Endpoint for development only.
 * Calling GET on this endpoint returns JSON describing all the tile definitions available on this service.
 *
 * Takes no URL parameters.
 *
 * @param req
 * @param res
 */
exports.tiles = function(req, res){
    var finalizeRequest = function(allDefinitions) {
        var toReturn = [];
        allDefinitions.forEach( function(batch) {
            toReturn = toReturn.concat( batch );
        });

        var conf = jive.service.options;
        var processed = jive.service.getExpandedTileDefinitions(toReturn);
        var body = JSON.stringify(processed, null, 4);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
    };

    q.all( [ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ] )
        .then( finalizeRequest );
};

/**
 * Endpoint for development only.
 *
 * Given a target jive host, calling GET on this endpoint will install any
 * tile definitions available on this service onto that jive host.
 *
 * If the jive host rejects the install POST, and returns a location header for a prexisting tile, this utility
 * attempts to update that tile with a PUT.
 *
 * Takes the following URL parameters:
 * - jiveHost: required target Jive host
 * - jivePort: optional target Jive Port, defaults to 80 if not specified
 * - context: optional non-root context path (eg. /sbs)
 * @deprecated
 * @private
 * @param req
 * @param res
 */
exports.installTiles = function( req, res ) {
    req.writeHead( 400 );
    req.end('Deprecated');
};

