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

var mustache = require('mustache');
var http = require('http');
var url = require('url');
var tileRegistry = require('../tile/registry');
var events = require('events');
var q = require('q');
var jive = require("../api");

function getProcessed(conf, all) {
    var host = conf.baseUrl + ':' + conf.port;
    var processed = [];

    all.forEach( function( tile ) {
        if ( !tile ) {
            return;
        }
        var name = tile.name;
        var stringified = JSON.stringify(tile);
        stringified =  mustache.render(stringified, {
            host: host,
            tile_public: host + '/tiles/' + name,
            tile_route: host + '/' + name,
            clientId: conf.clientId
        });

        var processedTile = JSON.parse(stringified);

        // defaults
        if ( !processedTile['published'] ) {
            processedTile['published'] = "2013-02-28T15:12:16.768-0800";
        }
        if ( !processedTile['updated'] ) {
            processedTile['updated'] = "2013-02-28T15:12:16.768-0800";
        }
        if ( processedTile['action'] ) {
            if ( processedTile['action'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['action'] = host + ( processedTile['action'].indexOf('/') == 0 ? "" : "/" ) + processedTile['action'];
            }
        }
        if ( !processedTile['config'] ) {
            processedTile['config'] = host + '/' + name + '/configure';
        } else {
            if ( processedTile['config'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['config'] = host + ( processedTile['config'].indexOf('/') == 0 ? "" : "/" ) + processedTile['config'];
            }
        }
        if ( !processedTile['register'] ) {
            processedTile['register'] = host + '/registration';
        } else {
            if ( processedTile['register'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['register'] = host + ( processedTile['register'].indexOf('/') == 0 ? "" : "/" ) + processedTile['register'];
            }
        }
        if ( !processedTile['client_id'] ) {
            processedTile['client_id'] = conf.clientId;
        }
        if ( !processedTile['id'] ) {
            processedTile['id'] = '{{{tile_id}}}';
        }

        processedTile.description += ' for ' + conf.clientId;
        processed.push( processedTile );
    });
    return processed;
}

/**
 * Endpoint for development only.
 *
 * Calling GET on this endpoint returns JSON describing all the tile definitions available on this service.
 *
 * Takes no URL parameters.
 *
 * @param req
 * @param res
 */
exports.tiles = function(req, res){
    var toShow = [];

    var finalize = function() {
        var conf = jive.config.fetch();

        var processed = getProcessed(conf, toShow);
        var body = JSON.stringify(processed, null, 4);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
    };

    jive.tiles.definitions.findAll().execute( function( tiles ) {
        if ( tiles ) {
            toShow = tiles;
        }

        jive.extstreams.definitions.findAll().execute( function( streams ) {
            if ( streams ) {
                toShow = toShow.concat( streams );
            }

            finalize();
        } );

    } );
};

exports.registration = function( req, res ) {
    var conf = jive.config.fetch();
    var clientId = conf.clientId;
    var url = req.body['url'];
    var guid = req.body['guid'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];

    var registerer = function( instanceLibrary ) {
        instanceLibrary.findByScope.execute( function(tileInstance) {
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
 * - jivePort: optinoal target Jive Port, defaults to 80 if not specified
 * - context: optional non-root context path (eg. /sbs)
 * @param req
 * @param res
 */
exports.installTiles = function( req, res ) {
    var conf = jive.config.fetch();

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var jiveHost = query['jiveHost'];
    var jivePort = query['jivePort'] || 80;
    var context = query['context'];

    var installer = function( definitions, callback ) {
        var processed = getProcessed(conf, definitions);
        var responses = {};

        var doDefinition = function( requestParams, tile, postBody ) {
            var deferred = q.defer();
            console.log("Making request to jive instance for " + tile.name + ":\n", postBody);

            var postRequest =  http.request( requestParams, function(jiveResponse) {
                var strBuf = [];
                jiveResponse.on('data', function (chunk) {
                    strBuf.push(chunk);
                }).on('end', function () {
                        var str = strBuf.join("");
                        responses[tile.name] = str;
                        console.log("Jive POST response for " + tile.name + ".  Status: " + jiveResponse.statusCode);
                        console.log("Headers: ", jiveResponse.headers);
                        console.log("Body: \n", str);

                        // special handling if its 409 - this means we should try to PUT instead
                        if ( jiveResponse.statusCode === 409 ) {
                            var existingLocation = jiveResponse.headers['location'];
                            if ( existingLocation ) {
                                var path = url.parse(existingLocation, true)['path'];

                                requestParams['method'] = 'PUT';
                                requestParams['path'] = path;

                                var putRequest =  http.request( requestParams, function(jiveResponse) {
                                    var strBuf = [];
                                    jiveResponse.on('data', function (chunk) {
                                        strBuf.push(chunk);
                                    }).on('end', function () {
                                            var str = strBuf.join("");
                                            responses[tile.name] = str;
                                            console.log("Jive PUT response for " + tile.name + ".  Status: " + jiveResponse.statusCode);
                                            console.log("Headers: ", jiveResponse.headers);
                                            console.log("Body: \n", str);
                                            deferred.resolve();
                                        });
                                });

                                putRequest.on('error', function(e) {
                                    console.log("error on request to jive instance: ", e);
                                });

                                putRequest.write(postBody, 'utf8');
                                putRequest.end();
                            }
                        } else {
                            deferred.resolve();
                        }
                    });
            });

            postRequest.on('error', function(e) {
                console.log("error on request to jive instance: ", e);
            });

            postRequest.write(postBody, 'utf8');
            postRequest.end();

            return deferred.promise;
        };

        (function processOne() {
            var tile = processed.shift();
            if ( !tile ) {
                callback(responses);

                return;
            }

            var postBody = JSON.stringify(tile);

            var requestParams = {
                host    : jiveHost, port: jivePort, method: 'POST',
                path    : ( context ? '/' + context : '' ) + '/api/jivelinks/v1/tiles/definitions',
                headers : { 'Authorization' : 'Basic YWRtaW46YWRtaW4='}
            };
            requestParams['headers']['Content-Length'] = Buffer.byteLength(postBody, 'utf8');

            doDefinition(requestParams, tile, postBody).then( processOne );
        })();

    };

    var allResponses = [];
    jive.tiles.definitions.findAll().execute( function( tiles ) {

        installer( tiles, function(responses) {
            if ( responses ) {
                allResponses = responses;
            }

            jive.extstreams.definitions.findAll().execute( function(extstreams) {

                installer( extstreams, function(responses) {

                    if ( responses ) {
                        allResponses = allResponses.concat( responses );
                    }

                    Object.keys(allResponses).forEach(function(jiveResp){
                        res.write("\n//");
                        res.write(jiveResp);
                        res.write(" response\n");
                        res.write(responses[jiveResp]);
                    });
                    res.end();

                });

            } );
        })

    });
};

