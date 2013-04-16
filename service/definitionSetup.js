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

var processCandidateRoutes = function(app, httpVerb, definitionName, routeHandlerPath, _routeContextPath) {
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

/**
 * Returns a promise when all the routes have been calculated for a particular definition directory.
 */
exports.setupDefinitionRoutes = function(app, definitionName, routesPath, root){
    if ( !root ) {
        root = routesPath;
    }

    return q.nfcall( fs.stat, routesPath ).then( function(stat) {
        if ( stat.isDirectory() ) {
            return q.nfcall(fs.readdir, routesPath)
                // process the routes
                .then( function( subItems ) {
                    var promises = [];
                    subItems.forEach( function( subItem ) {
                        promises.push( exports.setupDefinitionRoutes(app, definitionName, routesPath + "/" + subItem, root ) );
                    });

                    return q.all( promises );
                });
        } else if ( stat.isFile() ) {
            var routeFile = path.basename( routesPath );
            var currentDefinitionDir = path.dirname( routesPath );
            if ( isValidFile(routeFile) ) {

                var httpVerb = routeFile.substring(0, routeFile.length - 3).toLowerCase();
                var routeHandlerPath = (currentDefinitionDir + '/' + httpVerb);
                var routeContextPath = ('/' + definitionName + currentDefinitionDir.replace(root,''));

                processCandidateRoutes(app, httpVerb, definitionName, routeHandlerPath, routeContextPath);
            }
        }
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

