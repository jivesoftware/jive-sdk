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
var tileRegistry = require('jive-sdk/tile/registry');
var events = require('events');
var q = require('q');

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
    var app = req.app;
    var jiveApi = app.settings['jiveApi'];

    jiveApi.TileDefinition.findAll().execute( function( all ) {
        var conf = res.app.settings['jiveClientConfiguration'];

        var processed = getProcessed(conf, all);
        var body = JSON.stringify(processed, null, 4);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);

    } );
};

exports.registration = function( req, res ) {
    var conf = res.app.settings['jiveClientConfiguration'];
    var clientId = conf.clientId;
    var jiveApi = res.app.settings['jiveApi'];
    var url = req.body['url'];
    var config = req.body['config'];
    var name = req.body['name'];
    var code = req.body['code'];

    jiveApi.TileInstance.register(clientId, url, config, name, code).execute(
        function( tileInstance ) {
            console.log("registered tile instance", tileInstance );
            jiveApi.TileInstance.save(tileInstance).execute(function() {
                console.log( "persisted", tileInstance );
                tileRegistry.emit("newInstance." + name, tileInstance);
            });
        }
    );

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
    var app = req.app;
    var conf = res.app.settings['jiveClientConfiguration'];

    var jiveApi = app.settings['jiveApi'];

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var jiveHost = query['jiveHost'];
    var jivePort = query['jivePort'] || 80;
    var context = query['context'];

    jiveApi.TileDefinition.findAll().execute( function( all ) {
        var processed = getProcessed(conf, all);
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
                Object.keys(responses).forEach(function(jiveResp){
                    res.write("\n//");
                    res.write(jiveResp);
                    res.write(" response\n");
                    res.write(responses[jiveResp]);
                });
                res.end();
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

    });
};