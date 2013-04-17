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
    path  = require('path'),
    jive = require('../api');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var legalRouteVerbs = ['get', 'put', 'delete', 'post' ];
var legalServiceFileExtensions = [ '.json', '.js' ];

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

    return recursiveDirectoryProcessor( null, definitionName, svcDir, svcDir,
        function(app, definitionName, theFile, theDirectory) {

            var target = require(theDirectory + '/' + theFile);

            // task
            var task = target.task;
            if ( task ) {
                var taskToAdd = task;
                if (typeof task === 'function' ) {
                    // its a function, create a wrapping task object
                    taskToAdd = jive.tasks.build( task );
                }

                // enforce a standard key
                taskToAdd.setKey( definitionName  + '.' + theFile + "." + taskToAdd.getInterval() );
                jive.extstreams.definitions.addTasks( taskToAdd );
            }

            // event handler
            if ( target.eventHandlers ) {
                target.eventHandlers.forEach( function( handlerInfo ) {
                    jive.extstreams.definitions.addEventHandler( definitionName, handlerInfo['event'], handlerInfo['handler'] );
                 });
            }

            // definitionjson
            if ( target.definitionJSON ) {
                var definition = target.definitionJSON;
                definition.id = definition.id === '{{{definition_id}}}' ? null : definition.id;
                var apiToUse = definition['style'] === 'ACTIVITY' ?  jive.extstreams.definitions : jive.tiles.definitions;
                return apiToUse.save(definition);
            }
        },

        function(currentFsItem) {
            return legalServiceFileExtensions.indexOf(path.extname( currentFsItem ) ) > -1;
        }
    );
};

var recursiveDirectoryProcessor = function(app, definitionName, currentFsItem, root, processorFunction, filterFunction ) {
    return q.nfcall( fs.stat, currentFsItem ).then( function(stat) {
        if ( stat.isDirectory() ) {
            return q.nfcall(fs.readdir, currentFsItem)
                // process the routes
                .then( function( subItems ) {
                    var promises = [];
                    subItems.forEach( function( subItem ) {
                        promises.push( recursiveDirectoryProcessor( app, definitionName,
                            currentFsItem + '/' + subItem, root, processorFunction, filterFunction ) );
                    });

                    return q.all( promises );
                });
        } else if ( stat.isFile() ) {
            if ( !filterFunction || filterFunction( currentFsItem ) ) {
                var theDirectory = path.dirname( currentFsItem );
                var theFile = path.basename( currentFsItem );
                if ( isValidFile(theFile) ) {
                    var p = processorFunction( app, definitionName, theFile, theDirectory, root );
                    if ( p ) {
                        return p;
                    }
                }
            }
        }
    });
};

/**
 * Returns a promise when all the routes have been calculated for a particular definition directory.
 */
exports.setupDefinitionRoutes = function(app, definitionName, routesPath){

    var processCandidateRoutes = function(app, definitionName, theFile, theDirectory, root ) {
        var httpVerb = theFile.substring(0, theFile.length - 3).toLowerCase();
        var routeHandlerPath = (theDirectory + '/' + httpVerb);
        var _routeContextPath = ('/' + definitionName + theDirectory.replace(root,''));

        var legalVerbFile = legalRouteVerbs.indexOf(httpVerb) > -1;
        var routeHandler = require(routeHandlerPath);

        for ( var key in routeHandler ) {
            if ( !routeHandler.hasOwnProperty(key) ) {
                continue;
            }

            var routeContextPath = _routeContextPath;

            var added = false;
            var candidate = routeHandler[key];
            if ( typeof candidate === 'function' && key === 'route' && legalVerbFile ) {
                // if there is a function called 'route' and this is a legal verb file, register it
                app[httpVerb](routeContextPath, routeHandler.route);
                added = true;
            } else {
                // if its a valid route descriptor object, analyze it
                if ( typeof candidate == 'object' && candidate['verb'] && candidate['route'] ) {
                    // its a valid handler
                    var path =  candidate['path'] || key;
                    routeContextPath += "/" + path;
                    httpVerb = candidate['verb'];
                    app[httpVerb](routeContextPath, candidate['route']);
                    added = true;
                }
            }

            if ( added ) {
                console.log('Route added for', definitionName, ':',
                    httpVerb.toUpperCase(), routeContextPath, ' -> ',
                    routeHandlerPath + ".js" );
            }
        }
    };

    return recursiveDirectoryProcessor( app, definitionName, routesPath, routesPath, processCandidateRoutes );
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

        promises.push( fsexists(definitionDir).then( function(exists) {
            if ( exists ) {
                return exports.setupDefinitionServices( definitionName, definitionDir );
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

