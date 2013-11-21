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
    jive = require('../api'),
    service = require('./service');

var express = require('express');
var consolidate = require('consolidate');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

exports.legalRouteVerbs = ['get', 'put', 'delete', 'post' ];
exports.legalServiceFileExtensions = [ '.json', '.js' ];

function isValidFile(file ) {
    return !(file.indexOf('.') == 0)
}

exports.recursiveDirectoryProcessor = function(app, definitionName, currentFsItem, root, processorFunction, filterFunction ) {
    return q.nfcall( fs.stat, currentFsItem ).then( function(stat) {
        if ( stat.isDirectory() ) {
            return q.nfcall(fs.readdir, currentFsItem)
                // process the routes
                .then( function( subItems ) {
                    var promises = [];
                    subItems.forEach( function( subItem ) {
                        promises.push( exports.recursiveDirectoryProcessor( app, definitionName,
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
 *
 */
exports.setupRoutes = function(app, definitionName, routesPath, prefix) {

    var processCandidateRoutes = function(app, definitionName, theFile, theDirectory, root ) {
        var fileName = theFile.substring(0, theFile.length - 3);
        var httpVerb = fileName.toLowerCase();
        var routeHandlerPath = (theDirectory + '/' + fileName);
        var _routeContextPath = ('/' + definitionName + theDirectory.replace(root,''));

        var legalVerbFile = exports.legalRouteVerbs.indexOf(httpVerb) > -1;
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
                if ( prefix ) {
                    routeContextPath = prefix + routeContextPath;
                }
                app[httpVerb](routeContextPath, routeHandler.route.bind(app));
                added = true;
                // autowired verb file routes are never locked; explicitly wire if
                // lock is wanted
            } else {
                // if its a valid route descriptor object, analyze it
                if ( typeof candidate == 'object' && candidate['verb'] && candidate['route'] ) {
                    // its a valid handler
                    var path =  candidate['path'] || key;

                    if ( path !== '/' ) {
                        if ( path.indexOf('/') === 0 ) {
                            // in this case of /something
                            // its an absolute route ... use that as the mapping
                            routeContextPath = path;
                        } else {
                            routeContextPath =  (prefix ? prefix : '') + routeContextPath + "/" + path;
                        }
                    }

                    httpVerb = candidate['verb'];
                    app[httpVerb](routeContextPath, candidate['route']);

                    // lock the route if its marked to be locked
                    if ( candidate['jiveLocked'] ) {
                        service.security().lockRoute(  {
                            'verb' : httpVerb,
                            'path' : routeContextPath
                        }  );

                        jive.logger.info("locked route:", httpVerb, routeContextPath);
                    }

                    added = true;
                }
            }

            if ( added ) {
                jive.logger.debug('Route added for', definitionName, ':',
                    httpVerb.toUpperCase(), routeContextPath, ' -> ',
                    routeHandlerPath + ".js" );
            }
        }
    };

    return exports.recursiveDirectoryProcessor( app, definitionName, routesPath, routesPath, processCandidateRoutes );
};

function defaultSetupEventListener(handlerInfo, definitionName) {
    if (!handlerInfo['event']) {
        throw new Error('Event handler "'
            + definitionName + '" must specify an event name.');
    }
    if (!handlerInfo['handler']) {
        throw new Error('Event handler "'
            + definitionName + '" must specify a function handler.');
    }

    var eventListener = handlerInfo['eventListener'] || definitionName;

    if (jive.events.globalEvents.indexOf(handlerInfo['event']) != -1) {
        jive.events.addSystemEventListener(handlerInfo['event'], handlerInfo['handler']);
    } else {
        jive.events.addDefinitionEventListener(
            handlerInfo['event'],
            eventListener,
            handlerInfo['handler'],
            handlerInfo['description'] || 'Unique to definition'
        );
    }
}

/**
 */
exports.setupServices = function( app, definitionName, svcDir, setupEventListener, setupContext ) {
    /////////////////////////////////////////////////////
    // apply definition specific tasks, life cycle events, etc.

    setupEventListener = setupEventListener || defaultSetupEventListener;

    return exports.recursiveDirectoryProcessor( app, definitionName, svcDir, svcDir,
        function(app, definitionName, theFile, theDirectory) {
            var taskPath = theDirectory + '/' + theFile;
            var target = require(taskPath);

            if (  jive.events.globalEvents.indexOf(definitionName) != -1
                || jive.events.pushQueueEvents.indexOf(definitionName) != -1  ) {

                throw new Error('Illegal definition name ' + definitionName + ', collides with a reserved system identifier.' +
                    'Please choose a different definition name.');
            }


            // do service bootstrap
            if ( target['onBootstrap'] ) {
                jive.events.addLocalEventListener( "serviceBootstrapped", function() {
                    // bootstrap
                    jive.logger.debug("Bootstrapping " + definitionName + "...");
                    target['onBootstrap'](app);
                });
            }

            // event handlers
            if (target.eventHandlers) {
                target.eventHandlers.forEach(function (handlerInfo) {
                    setupEventListener(handlerInfo, definitionName, setupContext);
                });
            }

            // recurrent tasks
            // these are scheduled only if they haven't yet been scheduled by some other node
            var tasks = target.task;
            if ( ( service.role.isWorker() || service.role.isPusher() ) && tasks) {
                var tasksToAdd = [];
                if (tasks['forEach']) {
                    tasks.forEach(function(t) {
                        tasksToAdd.push(t);
                    });
                } else {
                    // if the task provided is just a function, then convert to object with 60 second interval
                    tasksToAdd.push(typeof tasks === 'function' ?  { 'handler': tasks, 'interval': 60 * 1000 } : tasks);
                }

                var noIDCounter = {};
                tasksToAdd.forEach(function(task) {
                    var eventID = task['event'], handler = task['handler'],  interval = task['interval'] || 60 * 1000,
                        context = task['context'] || {}, timeout = task['timeout'], event = task['event'];

                    if ( !eventID ) {
                        // if no eventID -- then the event is <tilename>.<interval>
                        var eventIDBase = definitionName + ( interval ? '.' + interval : '' );
                        var eventIDCount = noIDCounter[eventIDBase];
                        if ( !eventIDCount ) {
                            eventIDCount = 0;
                        }

                        eventID = eventIDBase + '.' + eventIDCount;
                        eventIDCount++;
                        noIDCounter[eventIDBase] = eventIDCount;
                    }

                    if ( !handler ) {
                        handler = jive.events.getDefinitionEventListenerFor(definitionName, event );
                        if ( handler && handler['forEach'] ) {
                            handler = handler[0]; // get only the first one
                        }
                    }

                    if ( handler ) {
                        target.eventHandlers = target.eventHandlers || [];

                        // task came with a handler; mix it into the list of target eventHandlers
                        if ( target.eventHandlers ) {
                            setupEventListener( {
                                'event' : eventID,
                                'handler' : handler
                            }, definitionName );
                            target.eventHandlers.push( );
                        }
                    } else {
                        throw new Error('Task for tile definition "'
                            + definitionName + '" must specify a function handler.');
                    }

                    context['event'] = eventID;
                    context['eventListener'] = definitionName;

                    // only attempt to schedule events after bootstrap is complete
                    jive.events.addLocalEventListener( "serviceBootstrapped", function() {
                        jive.context.scheduler.schedule(eventID, context, interval, undefined, undefined, timeout );
                    });
                });
            }
        },

        function(currentFsItem) {
            return exports.legalServiceFileExtensions.indexOf(path.extname( currentFsItem ) ) > -1;
        }
    );
};