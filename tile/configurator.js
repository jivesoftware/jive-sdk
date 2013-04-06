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

var fs              = require('fs'),
    q               = require('q'),
    scheduler       = require('./simpleScheduler'),
    tileRegistry    = require('./registry');

exports.configureTiles = function(app) {

    var jiveApi = app.settings['jiveApi'];
    var rootDir = app.settings['rootDir'];
    var tilesDir = rootDir + '/tiles';

    var isValidFile = function(file ) {
        return !(file.indexOf('.') == 0)
    };

    // configure global routes
    console.log('Configuring global framework routes.');
    app.get('/tiles', require('../routes/tiles').tiles);
    app.get('/tilesInstall', require('../routes/tiles').installTiles);
    app.post('/registration', require('../routes/tiles').registration);

    function addTileRoutesToApp(data){
        var proms = [];

        data.routes.forEach( function( currentRoute ) {
            var currentTileDir = tilesDir + '/' + data.currentTile + '/routes/' + currentRoute;

            if ( !isValidFile(currentRoute) ) {
                return;
            }

            //Look in the routes directory for the current tile.
            //for each file that is in there that matches an http verb, add it to the app as a route
            proms.push(q.nfcall(fs.readdir, currentTileDir).then(function(verbDirs){
                //todo: check to make sure the file you are adding is a legit http verb
                verbDirs.forEach(function(httpVerbFile){
                    if ( !isValidFile(httpVerbFile) ) {
                        return;
                    }

                    var httpVerb = httpVerbFile.substring(0, httpVerbFile.length - 3);

                    //todo: determine how to fix this. it's quite brittle b/c it depends on the location of this file
                    var routeHandlerPath = (currentTileDir + '/' + httpVerb);
                    var routeContextPath = ('/' + data.currentTile + '/' + currentRoute);

                    console.log('Tile route added for ', data.currentTile, ': ', routeContextPath, ' -> ', routeHandlerPath );
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
                            console.log("Tile saved:", tileName );
                        }
                    );

                } else {
                    console.log( 'Tile loaded:', tile );
                }
            }
        );

        //////////////////////////////////
        /// attach global event listeners

        tileRegistry.addListener("newInstance." + definition.name, function(theInstance){
            console.log("a new " + definition.name + " instance was created", theInstance);
        });
        tileRegistry.addListener("destroyingInstance." + definition.name, function(theInstance){
            console.log("Instance of " + definition.name + " is being destroyed", theInstance);
        });
        tileRegistry.addListener("destroyedInstance." + definition.name, function(theInstance){
            console.log("Instance of " + definition.name + " has been destroyed", theInstance);
        });
        tileRegistry.addListener("pushedUpdateInstance." + definition.name, function(tileInstance, type, pushedData, response ){
            console.log(type + ' push to', tileInstance.url, response.statusCode, tileInstance.name);
        });
        tileRegistry.addListener("pushDataInstance." + definition.name, function(tileInstance, data, callback){
            jiveApi.TileInstance.pushData( app.settings.jiveClientConfiguration.clientId, tileInstance, data, callback );
        });
        tileRegistry.addListener("pushActivityInstance." + definition.name, function(tileInstance, data, callback){
            jiveApi.TileInstance.pushActivity( app.settings.jiveClientConfiguration.clientId, tileInstance, data, callback );
        });

        /////////////////////////////////////////////////////
        // apply tile specific tasks, life cycle events, etc.

        q.nfcall(fs.readdir, tileDir + '/services' ).then(function(tilesDirContents){
            tilesDirContents.forEach(function(item) {
                if ( !isValidFile(item) ) {
                    return;
                }

                var theFile = tileDir + '/services/' + item;

                var target = require(theFile);

                // schedule task
                if ( target.task ) {
                    var interval = (target.task.getInterval ? target.task.getInterval() : undefined ) || target.interval || 15000;
                    var key = tile + "." + item + ".task";
                    scheduler.schedule(key, interval,
                        typeof target.task === 'function' ? target.task : target.task.getRunnable(),
                        {app: app}
                    );
                }

                // register life cycle stuff
                if ( target.registerEvents ) {
                    target.registerEvents(tileRegistry, definition);
                }
            });

        });
    }

    function addTileConfiguration(tile, routePath){
        var routes = q.nfcall(fs.readdir, routePath).then(function(routesToAdd){
            addTileRoutesToApp({"routes":routesToAdd, "currentTile":tile});
        });

        handleTileRegistration(tile);
        return routes;
    }

    //Find the tiles by walking the tileDir tree
    var tiles = [];
    var tileRoutesPaths = [];
    return q.nfcall(fs.readdir, tilesDir).then(function(tilesDirContents){
        var proms = [];
        tilesDirContents.forEach(function(item) {
            if ( !isValidFile(item) ) {
                return;
            }
            var tileDirPath = tilesDir + '/' + item + '/routes';
            proms.push(addTileConfiguration(item, tileDirPath));
            tileRoutesPaths.push( tileDirPath );
            tiles.push( item );
        });
        return q.all(proms).then(function(){
            //We've added all the routes for the tiles and actions throw the event that indicates we are done
            console.log("Finished tile config");
            app.emit('event:tileConfigurationComplete', app);
        });
    }).done();

};
