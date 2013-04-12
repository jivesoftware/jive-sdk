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
    jive    = require('../api');

exports.configureTiles = function(app) {

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
                verbDirs.forEach(function(httpVerbFile){
                    if ( !isValidFile(httpVerbFile) ) {
                        return;
                    }

                    var httpVerb = httpVerbFile.substring(0, httpVerbFile.length - 3);
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

        /////////////////////////////////////////////////////
        // apply tile specific tasks, life cycle events, etc.

        var tasks = [];
        var events = [
            {
                'event': 'newInstance',
                'handler' : function(theInstance){
                    console.log("a new " + definition.name + " instance was created", theInstance);
                }
            },

            {
                'event': 'destroyingInstance',
                'handler' : function(theInstance){
                    console.log("Instance of " + definition.name + " is being destroyed", theInstance);
                }
            },

            {
                'event': 'destroyedInstance',
                'handler' : function(theInstance){
                    console.log("Instance of " + definition.name + " has been destroyed", theInstance);
                }
            },

            {
                'event': 'pushedUpdateInstance',
                'handler' : function(theInstance, type, pushedData, response){
                    console.log(type + ' push to', tileInstance.url, response.statusCode, tileInstance.name);
                }
            }
        ];

        q.nfcall(fs.readdir, tileDir + '/services' ).then( q.nfcall(function(tilesDirContents){
            tilesDirContents.forEach(function(item) {
                if ( !isValidFile(item) ) {
                    return;
                }

                var theFile = tileDir + '/services/' + item;
                var target = require(theFile);

                // schedule task
                if ( target.task ) {
                    tasks.push( target.task );
                }

                // register life cycle stuff
                if ( target.registerEvents ) {     // xxx - todo - what if not array??
                    events = events.concat( events.registerEvents() );
                }
            })
        })).then( function() {
            var libraryFunction;
            if ( definition['style'] === 'ACTIVITY' ) {
                libraryFunction = jive.extstreams.definitions;
            } else {
                libraryFunction = jive.tiles.definitions;
            }

            libraryFunction.configure(definition, events, tasks, function() {
                console.log("done configuring", definition['name']);
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
