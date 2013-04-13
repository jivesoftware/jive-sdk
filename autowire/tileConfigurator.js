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

var fs = require('fs'),
    q  = require('q'),
    jive = require('../api');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var isValidFile = function(file ) {
    return !(file.indexOf('.') == 0)
};

/**
 * Returns a promise when defintion tasks, life cycle events,
 * and other things in the service directory have been processed.
 * @param definition
 * @param svcDir
 * @return {*}
 */
function processServices( definition, svcDir ) {
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

    if ( !fs.existsSync( svcDir ) ) {
        return;
    }

    return q.nfcall(fs.readdir, svcDir ).then( function(tilesDirContents) {

        var tasks = [];
        var events = [];
        events = events.concat(baseEvents);

        // analyze the directory contents, picking up tasks and events
        tilesDirContents.forEach(function(item) {
            if ( isValidFile(item) ) {
                var theFile = svcDir + '/' + item;
                var target = require(theFile);

                // task
                if ( target.task ) {
                    target.task.setKey( definition.name  + '.' + item + "." + target.task.getInterval() );
                    tasks.push( target.task );
                }

                // event handler
                if ( target.registerEvents ) {
                    events = events.concat( target.registerEvents );
                }
            }
        });

        // add the event listeners and tasks that were found
        jive.extstreams.definitions.addListeners( definition.name, events );
        jive.extstreams.definitions.addTasks( tasks );
    });
}

/**
 * Returns a promise when all the tile routes have been calculated for a particular tile directory.
 * @param tileInfo
 * @return {*}
 */
function addTileRoutesToApp(app, tileInfo){
    var promises = [];

    tileInfo.routes.forEach( function( currentRoute ) {
        if ( !isValidFile(currentRoute) ) {
            return;
        }

        //Look in the routes directory for the current tile.
        //for each file that is in there that matches an http verb, add it to the app as a route
        var currentTileDir = tileInfo.routePath + '/' + currentRoute;
        promises.push(q.nfcall(fs.readdir, currentTileDir).then( function(verbDirs){
            verbDirs.forEach(function(httpVerbFile){
                if ( !isValidFile(httpVerbFile) ) {
                    return;
                }

                var httpVerb = httpVerbFile.substring(0, httpVerbFile.length - 3);
                var routeHandlerPath = (currentTileDir + '/' + httpVerb);
                var routeContextPath = ('/' + tileInfo.currentTile + '/' + currentRoute);

                console.log('Tile route added for ', tileInfo.currentTile, ': ', routeContextPath, ' -> ', routeHandlerPath );
                var routeHandler = require(routeHandlerPath);
                if (typeof app[httpVerb] == 'function') {
                    app[httpVerb](routeContextPath, routeHandler.route);
                }
            });
        }));
    });

    // convert the collected promises into a single promise that returns when they're all successfull
    return q.all(promises);
}

/**
 * Returns a promise
 * @param app
 * @param tileDir
 */
function configureOneTileDir( app, tile, tileDir ) {
    var definitionPath = tileDir + '/definition.json';
    var servicesPath = tileDir + '/services';
    var routesPath = tileDir + '/routes';
    var definition = JSON.parse( fs.readFileSync( definitionPath, 'utf8' ) );
        definition.id = definition.id === '{{{tile_id}}}' ? null : definition.id;

    var routesPromise = q.nfcall(fs.readdir, routesPath)
    // process the routes
    .then( function(routesToAdd) {
        return addTileRoutesToApp( app, { "routePath" : routesPath, "routes":routesToAdd, "currentTile":tile} )
    });

    var servicesPromise = processServices( definition, servicesPath );

    var allPromises = [];
    if ( routesPromise ) {
        allPromises.push(routesPromise);
    }

    if ( servicesPromise ) {
        allPromises.push(servicesPromise);
    }

    var masterPromise = q.all( allPromises  );

    return masterPromise.then( function(gg) {
        // save the definition when we're done
        jive.extstreams.definitions.save( definition).execute( function() {
            console.log("saved", definition.name );
        });
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// public

exports.configureOneTileDir = configureOneTileDir;

exports.configureTilesDir = function( app, tilesDir ) {
    //Find the tiles by walking the tileDir tree
    return q.nfcall(fs.readdir, tilesDir).then(function(tilesDirContents){
        var proms = [];
        tilesDirContents.forEach(function(item) {
            if ( !isValidFile(item) ) {
                return;
            }
            var tileDirPath = tilesDir + '/' + item ;
            proms.push(configureOneTileDir(app, item, tileDirPath));
        });

        return q.all(proms).then(function(){
            //We've added all the routes for the tiles and actions throw the event that indicates we are done
            console.log("Finished tile config");
            app.emit('event:tileConfigurationComplete', app);
        });
    }).done();
};

