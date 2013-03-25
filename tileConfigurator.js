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

var fs      = require('fs'),
    __      = require('underscore'),
    q = require('q'),
    scheduler = require('./simpleScheduler'),
    tileRegistry = require('./tileRegistry'),
    events = require('events'),
    util = require('util');

function configureTiles(app) {
    var jiveApi = app.settings['jiveApi'];
    var rootDir = app.settings['rootDir'];
    var tilesDir = rootDir + '/tiles';

    function addTileRoutesToApp(data){
        console.log("adding routes");
        var proms = [];

        data.routes.forEach( function( currentRoute ) {
            var currentTileDir = tilesDir + '/' + data.currentTile + '/routes/' + currentRoute;

            //Look in the routes directory for the current tile.
            //for each file that is in there that matches an http verb, add it to the app as a route
            proms.push(q.nfcall(fs.readdir, currentTileDir).then(function(verbDirs){
                //todo: check to make sure the file you are adding is a legit http verb
                verbDirs.forEach(function(httpVerbFile){
                    var httpVerb = httpVerbFile.substring(0, httpVerbFile.length - 3);

                    //todo: determine how to fix this. it's quite brittle b/c it depends on the location of this file
                    var routeHandlerPath = (currentTileDir + '/' + httpVerb);
                    var routeContextPath = ('/' + data.currentTile + '/' + currentRoute);

                    console.log('adding route', routeContextPath, ' -> ', routeHandlerPath );
                    var routeHandler = require(routeHandlerPath);
                    if (typeof app[httpVerb] == 'function') {
                        app[httpVerb](routeContextPath, routeHandler.route);
                    }
                });
            }));
        });
        return q.all(proms);
    }

    function handleTileRegistration( tile ) {
        var tileDir = tilesDir + '/' + tile;
        var definitionPath = tileDir + '/definition.json';
        var definition = JSON.parse( fs.readFileSync( definitionPath, 'utf8' ) );
        definition.id = definition.id === '{{{tile_id}}}' ? null : definition.id;
        var tileName = definition.name;

        jiveApi.TileDefinition.findByTileName(tileName).execute(
            function(dbTile) {
                if ( dbTile == null ) {
                    // persist tile since its not yet persisted
                    jiveApi.TileDefinition.save( definition).execute(
                        function() {
                            console.log("Persisted", tileName );
                        }
                    );

                } else {
                    console.log( 'tile', tile, 'already in db' );
                }
            }
        );

        fs.stat(tileDir + '/services/datapusher.js', function(err, stats){
            if(!err && stats.isFile()){
                var pusher = require(tileDir + '/services/datapusher');
                // schedule task
                var interval = pusher.interval || 10000;
                var key = tile + ".task";
                scheduler.schedule(key, interval,
                    typeof pusher.task === 'function' ? pusher.task : pusher.task.runnable,
                    {app: app}
                );

                // events
                if ( typeof pusher.task !== 'function' ) {
                    pusher.task.on("event:pushData", function ( tileInstance, data, callback ) {
                        jiveApi.TileInstance.pushData( app.settings.jiveClientConfiguration.clientId, tileInstance, data, callback );
                    } );

                    pusher.task.on("event:pushActivity", function ( client_id, tileInstance, data, callback ) {
                        jiveApi.TileInstance.pushActivity( app.settings.jiveClientConfiguration.clientId, tileInstance, data, callback );
                    } );
                }
            }
        });

        fs.stat(tileDir + '/services/lifecycle.js', function(err, stats){
            if(!err && stats.isFile()){
                var lifecycle = require(tileDir + '/services/lifecycle');
                if(lifecycle.init){
                    lifecycle.init(tileRegistry, definition);
                }
            }
        });
    }

    function addClientConfiguration(tile, routePath){
        console.log("Tile Routes for " + tile);
        var routes = q.nfcall(fs.readdir, routePath).then(function(routesToAdd){
            addTileRoutesToApp({"routes":routesToAdd, "currentTile":tile});
        });

        console.log("Handling Tile Registration for " + tile);
        handleTileRegistration(tile);
        return routes;
    }

    function finishClientConfiguration() {
        var config = app.settings['jiveClientConfiguration'];
        var appName = config.appName;
        var prom = q.defer();

        jiveApi.Application.findByAppName(appName).execute( function(foundApp) {

            if ( foundApp ) {
                config.clientId = foundApp.clientId;
                prom.resolve();
            } else {
                // register app, and proceed
                app.settings['jiveClient'].Application.register(
                    {
                        'appName' : config.appName,
                        'appDescription': config.appDescription,
                        'userEmail': config.userEmail,
                        'userPassword': config.userPassword,
                        'callbackURL': config.callbackURL
                    },
                    function( application ) {
                        // set clientId
                        config.clientId = application.clientId;
                        application.name = config.appName;
                        jiveApi.Application.save( application ).execute(function(){
                            prom.resolve();
                        });
                    },
                    function(){
                        prom.reject.apply(prom, arguments);
                    }
                );
            }
        });
        return prom;
    }

    //Find the tiles by walking the tileDir tree
    var tiles = [];
    var tileRoutesPaths = [];
    return q.nfcall(fs.readdir, tilesDir).then(function(tilesDirContents){
        var proms = [];
        tilesDirContents.forEach(function(item) {
            var tileDirPath = tilesDir + '/' + item + '/routes';
            proms.push(addClientConfiguration(item, tileDirPath));
            tileRoutesPaths.push( tileDirPath );
            tiles.push( item );
        });
        return q.all(proms).then(finishClientConfiguration).then(function(){
            //We've added all the routes for the tiles and actions throw the event that indicates we are done
            console.log("Finished client config");
            app.emit('event:clientConfigurationComplete', app);
        });
    }).done();
}

/*
This is invoked on an event handler
*/
exports.configureTiles = configureTiles;
