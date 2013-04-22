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

var url = require('url');
var http = require('http');
var q = require('q');
var jive = require("../api");
var mustache = require('mustache');

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
    var finalizeRequest = function(allDefinitions) {
        var toReturn = [];
        allDefinitions.forEach( function(batch) {
            toReturn = toReturn.concat( batch );
        });

        var conf = jive.service.options;
        var processed = getProcessed(conf, toReturn);
        var body = JSON.stringify(processed, null, 4);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
    };

    q.all( [ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ] )
        .then( finalizeRequest );
};

// xxx todo this needs to be cleaned up -- and it might now belong here
function getProcessed(conf, all) {
    var host = conf.clientUrl +
        ( (conf.port == 80 || conf.port == 443) ? '' : ( ':' + conf.port ) );
    var processed = [];

    all.forEach( function( tile ) {
        if ( !tile ) {
            return;
        }
        var name = tile.name;
        var stringified = JSON.stringify(tile);
        stringified =  mustache.render(stringified, {
            host: host,
            tile_public: host + '/' + name,
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
            processedTile['id'] = '{{{definition_id}}}';
        }

        processedTile.description += ' for ' + conf.clientId;
        processed.push( processedTile );
    });
    return processed;
}

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
    var conf = jive.service.options;

    var reqUrl = req.url;
    var url_parts = url.parse(reqUrl, true);
    var query = url_parts.query;

    var jiveHost = query['jiveHost'];
    var jivePort = query['jivePort'] || 80;
    var context = query['context'];
    var protocol = query['protocol'] || 'http';
    var credentials = query['credentials'] || 'YWRtaW46YWRtaW4=';

    var definitionPostURL = protocol + '://' + jiveHost + ( context ? '/' + context : '' ) + '/api/jivelinks/v1/tiles/definitions';

    var installer = function( definitions, callback ) {
        var processed = getProcessed(conf, definitions);
        var responses = {};

        var doDefinition = function( requestOptions, tile, postBody ) {
            var deferred = q.defer();
            console.log("Making request to jive instance for " + tile.name + ":\n", postBody);

            jive.util.buildRequest(definitionPostURL, 'POST', postBody, requestOptions['headers']).then(
                // success
                function(jiveResponse) {

                    var str = JSON.stringify(jiveResponse);
                    responses[tile.name] = str;
                    console.log("Jive POST response for " + tile.name + ".  Status: " + jiveResponse.statusCode);
                    console.log("Headers: ", jiveResponse.headers);
                    console.log("Body: \n", str);

                    deferred.resolve();
                },

                // fail
                function(jiveResponse) {
                    console.log("Error on POST request to jive instance!");

                    var str = JSON.stringify(jiveResponse);

                    console.log("Headers: ", jiveResponse.headers);
                    console.log("Body: \n", str);

                    // special handling if its 409 - this means we should try to PUT instead
                    if ( jiveResponse.statusCode === 409 ) {
                        var existingLocation = jiveResponse.headers['location'];
                        console.log("Trying PUT to ", existingLocation, "...");
                        if ( existingLocation ) {
                            jive.util.buildRequest(existingLocation, 'PUT', postBody, requestOptions['headers']).then(
                                // success
                                function(jiveResponse) {
                                    var str = JSON.stringify(jiveResponse);
                                    responses[tile.name] = str;
                                    console.log("Jive PUT response for " + tile.name + ".  Status: " + jiveResponse.statusCode);
                                    console.log("Headers: ", jiveResponse.headers);
                                    console.log("Body: \n", str);
                                    deferred.resolve();
                                },

                                // error
                                function(e) {
                                    console.log("Error on PUT request to jive instance: ", e);
                                    deferred.reject(jiveResponse);
                                }
                            );
                        }
                    } else {
                        deferred.reject(jiveResponse);
                    }
                }
            );

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
                headers : { 'Authorization' : 'Basic ' + credentials, 'Content-Type' : 'application/json' }
            };

            doDefinition(requestParams, tile, postBody).then(
                processOne,
                processOne
            );
        })();

    };

    var allResponses = [];
    jive.tiles.definitions.findAll().then( function( tiles ) {

        installer( tiles, function(responses) {
            if ( responses ) {
                allResponses = typeof responses === 'array' ? responses : [responses];
            }

            jive.extstreams.definitions.findAll().then( function(extstreams) {

                installer( extstreams, function(responses) {

                    if ( responses ) {
                        allResponses = allResponses.concat( typeof responses === 'array' ? responses : [responses] );
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    Object.keys(allResponses).forEach(function(jiveResp){
                        var def = Object.keys(allResponses[jiveResp])[0];
                        if ( def  ) {
                            res.write("\n//");
                            res.write(def );
                            res.write(" response\n");
                            res.write( JSON.stringify(allResponses[jiveResp], null, 4) );
                        }
                    });
                    res.end();

                });

            } );
        })

    });
};

