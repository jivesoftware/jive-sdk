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

exports.configureTiles = function(app, tilesDir) {

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
        var svcDir =  tileDir + '/services';
        var definitionPath = tileDir + '/definition.json';
        var definition = JSON.parse( fs.readFileSync( definitionPath, 'utf8' ) );
        definition.id = definition.id === '{{{tile_id}}}' ? null : definition.id;

        /////////////////////////////////////////////////////
        // apply tile specific tasks, life cycle events, etc.

        var baseEvents = [
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
                'event': 'dataPushed',
                'handler' : function(theInstance, pushedData, response){
                    console.log('data push to', theInstance.url, response.statusCode, theInstance.name);
                }
            },

            {
                'event': 'activityPushed',
                'handler' : function(theInstance, pushedData, response){
                    console.log('activity push to', theInstance.url, response.statusCode, theInstance.name);
                }
            },

            {
                'event': 'commentPushed',
                'handler' : function(theInstance, pushedData, response){
                    console.log('comment push to', theInstance.url, response.statusCode, theInstance.name);
                }
            }
        ];

        var doIt = function(dd, events, tasks) {
            var style = dd['style'];
            var ff;
            if ( style === 'ACTIVITY' ) {
                ff = jive.extstreams.definitions;
            } else {
                ff = jive.tiles.definitions;
            }

            ff.configure(dd, events, tasks, function() {
                console.log("done configuring", dd['name']);
            });
        };


        if ( !fs.existsSync(svcDir ) ) {
            return q.nfcall( doIt, definition, baseEvents, []).then(function() {
                console.log("done configuring", definition['name']);
            });
        }

       return q.nfcall(fs.readdir, svcDir ).then( function(tilesDirContents) {

           var tasks = [];
           var events = [];
           events = events.concat(baseEvents);

           tilesDirContents.forEach(function(item) {
                if ( isValidFile(item) ) {
                    var theFile = svcDir + '/' + item;
                    var target = require(theFile);

                    // task
                    if ( target.task ) {
                        target.task.setKey( tile + '.' + item + "." + target.task.getInterval() );
                        tasks.push( target.task );
                    }

                    // event handler
                    if ( target.registerEvents ) {     // xxx - todo - what if not array??
                        events = events.concat( target.registerEvents );
                    }
                }
            });

           doIt( definition, events, tasks );
        });
    }

    function addTileConfiguration(tile, routePath){
        var routes = q.nfcall(fs.readdir, routePath).then(function(routesToAdd){
            addTileRoutesToApp({"routes":routesToAdd, "currentTile":tile});
        });

        var detail = handleTileRegistration(tile);

        var r = [ routes ];
        if ( detail ) {
            r.push(detail);
        }

        return q.all( r );
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
