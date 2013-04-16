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

function isValidFile(file ) {
    return !(file.indexOf('.') == 0)
}

function fsexists(path) {
    var deferred = q.defer();
    var method = fs.exists ? fs.exists : require('path').exists;
    method( path, function(exists ) {
        deferred.resolve(exists);
    });

    return deferred.promise;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// public

/**
 * Returns a promise when defintion tasks, life cycle events,
 * and other things in the service directory have been processed.
 * @param definitionName
 * @param svcDir
 * @return {*}
 */
exports.setupDefinitionServices = function( definitionName, svcDir ) {
    /////////////////////////////////////////////////////
    // apply definition specific tasks, life cycle events, etc.

    return q.nfcall(fs.readdir, svcDir ).then( function(dirContents) {

        var tasks = [];
        var events = [];

        // add in the base event handlers
        events = events.concat(jive.events.baseEvents);

        // analyze the directory contents, picking up tasks and events
        dirContents.forEach(function(item) {
            if ( isValidFile(item) ) {
                var theFile = svcDir + '/' + item;
                var target = require(theFile);

                // task
                var task = target.task;
                if ( task ) {
                    var taskToAdd = task;
                    if (typeof task === 'function' ) {
                        // its a function, create a wrapping task object
                        taskToAdd = jive.tasks.build( task );
                    }

                    // enforce a standard key
                    taskToAdd.setKey( definitionName  + '.' + item + "." + taskToAdd.getInterval() );
                    tasks.push( taskToAdd );
                }

                // event handler
                if ( target.eventHandlers ) {
                    events = events.concat( target.eventHandlers );
                }
            }
        });

        // add the event handlers
        events.forEach( function( handlerInfo ) {
            jive.extstreams.definitions.addEventHandler( definitionName, handlerInfo['event'], handlerInfo['handler'] );
        });

        // add the tasks
        jive.extstreams.definitions.addTasks( tasks );
    });
};

/**
 * Returns a promise when all the routes have been calculated for a particular definition directory.
 * @param definitionInfo
 * @return {*}
 */
exports.setupDefinitionRoutes = function(app, definitionName, routesDirPath){

    return q.nfcall(fs.readdir, routesDirPath)
        // process the routes
    .then( function( routesToAdd ) {

        var promises = [];

        routesToAdd.forEach( function( currentRoute ) {
            if ( !isValidFile(currentRoute) ) {
                return;
            }

            //Look in the routes directory for the current definition.
            //for each file that is in there that matches an http verb, add it to the app as a route
            var currentDefinitionDir = routesDirPath + '/' + currentRoute;
            promises.push(q.nfcall(fs.readdir, currentDefinitionDir).then( function(verbDirs){
                verbDirs.forEach(function(httpVerbFile){
                    if ( !isValidFile(httpVerbFile) ) {
                        return;
                    }

                    var httpVerb = httpVerbFile.substring(0, httpVerbFile.length - 3);
                    var routeHandlerPath = (currentDefinitionDir + '/' + httpVerb);
                    var routeContextPath = ('/' + definitionName + '/' + currentRoute);

                    console.log('Definition route added for ', definitionName, ': ', routeContextPath, ' -> ', routeHandlerPath );
                    var routeHandler = require(routeHandlerPath);
                    if (typeof app[httpVerb] == 'function') {
                        app[httpVerb](routeContextPath, routeHandler.route);
                    }
                });
            }));
        });

        // convert the collected promises into a single promise that returns when they're all successfull
        return q.all(promises);
    });
};

exports.setupDefinitionMetadata = function(definitionPath) {
    // if a definition exists, read it from disk and save it
    return fsexists(definitionPath).then( function(exists) {
        if ( exists ) {
            return q.nfcall( fs.readFile, definitionPath).then( function(data ) {
                var definition = JSON.parse(data);
                definition.id = definition.id === '{{{definition_id}}}' ? null : definition.id;
                return definition;
            }).then( function( definition ) {
                var apiToUse = definition['style'] === 'ACTIVITY' ?  jive.extstreams.definitions : jive.tiles.definitions;
                return apiToUse.save(definition);
            });
        }
    });
};

/**
 * Returns a promise for detecting when the definition directory has been autowired.
 * Assumes that the definintion directory is exactly the same as the definition name, eg.:
 *
 * /tiles/my-twitter-definition
 *
 * In this case the definition name is my-twitter-definition.
 * @param definitionDir
 */
exports.setupOneDefinition = function( app, definitionDir, definitionName  ) {
    definitionName = definitionName || (definitionDir.substring( definitionDir.lastIndexOf('/') + 1, definitionDir.length ) ); /// xxx todo this might not always work!
    var definitionPath = definitionDir + '/definition.json';
    var servicesPath = definitionDir + '/services';
    var routesPath = definitionDir + '/routes';

    // if a definition exists, read it from disk and save it
    var definitionPromise = exports.setupDefinitionMetadata(definitionPath);

    // wire up service and routes
    return definitionPromise.then( function() {
        var promises = [];

        promises.push( fsexists(routesPath).then( function(exists) {
            if ( exists ) {
                return exports.setupDefinitionRoutes( app,definitionName, routesPath );
            }
        }));

        promises.push( fsexists(servicesPath).then( function(exists) {
            if ( exists ) {
                return exports.setupDefinitionServices( definitionName, servicesPath );
            }
        }));

        return q.all(promises);
    }).fail(function(f) {
        console.log(f);
    });
};

/**
 * Autowires each definition discovered in the provided definitions directory.
 * @param definitionsRootDir
 * @return {*}
 */
exports.setupAllDefinitions = function( app, definitionsRootDir ) {
    return q.nfcall(fs.readdir, definitionsRootDir).then(function(dirContents){
        var proms = [];
        dirContents.forEach(function(item) {
            if ( !isValidFile(item) ) {
                return;
            }
            var dirPath = definitionsRootDir + '/' + item ;
            proms.push(exports.setupOneDefinition(app, dirPath));
        });

        return q.all(proms);
    });
};

