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

var q = require('q');
var jive = require('../../api');

function Scheduler() {
    return this;
}

/**
 * An in-memory implementation of scheduler.
 * @class memoryScheduler
 */
module.exports = Scheduler;

var tasks = {};
var running = {};
var lastRunTs = {};

var eventHandlerMap = {};


/**
 * @memberof memoryScheduler
 * @param _eventHandlerMap
 */
function init( _eventHandlerMap ) {
    eventHandlerMap = _eventHandlerMap || jive.events.eventHandlerMap;

    // setup listeners
    jive.events.globalEvents.forEach( function(event) {
        var handlers = eventHandlerMap[event];

        if ( handlers ) {
            if ( typeof handlers === 'function' ) {
                // normalize single handler into an array
                handlers = [ handlers ];
            }

            handlers.forEach( function( handler ) {
                jive.events.addLocalEventListener( event, handler );
            });
        }

    });

    return this;
}
Scheduler.prototype.init = init;

/**
 * Schedule a task.
 * @memberof memoryScheduler
 * @param eventID which event to fire
 * @param context what to pass to the event
 * @param interval The interval to invoke the callback
 * @param delay The number of milliseconds after which the event will be fired for the first time.
 * @param exclusive If true, then will not execute if another event named with the same eventID is already executing.
 * @param timeout The number of milliseconds, after which the schedule will declare the event has timed out, and will fire the reject on any promise that was returned.
 * @returns {Object} Promise
 */
function schedule(eventID, context, interval, delay, exclusive, timeout) {
    eventID = eventID || jive.util.guid();

    context = context || {};
    var deferred = q.defer();
    var handlers;
    if (context['eventListener']) {
        if ( eventHandlerMap[context['eventListener']] ) {
            handlers = eventHandlerMap[context['eventListener']][eventID];
        }
    } else {
        handlers = eventHandlerMap[eventID];
    }

    handlers = handlers || [];

    var next = function(timer, eventID) {
        var promises = [];
        running[eventID] = true;
        lastRunTs[eventID] = new Date().getTime();

        handlers.forEach( function(handler) {
            var p = handler(context);
            if ( p && p['then'] ) {
                promises.push(p);
            }
        });

        q.all( promises).then(
            // success
            function(result ) {
                result = result['forEach'] && result.length == 1 ? result[0] : result;
                // nuke self, if no longer scheduled
                if ( timer && eventID && !tasks[eventID] ) {
                    clearInterval(timer);
                }
                delete running[eventID];
                deferred.resolve(result);
            },

            // fail
            function(e) {
                if ( timer && eventID && !tasks[eventID] ) {
                    clearInterval(timer);
                }
                delete running[eventID];
                deferred.reject(e);
            }
        );
    };

    if (interval) {
        if ( !running[eventID] ) {
            var d = delay || 1;
            setTimeout( function() {
                var timer = tasks[eventID] = setInterval(function() {
                    var hasTimedOut = timeout ? new Date().getTime() - (lastRunTs[eventID] || 0) > timeout : false;
                    if ( !running[eventID] || hasTimedOut ) {
                        if (hasTimedOut ) {
                            jive.logger.debug(eventID,'timed out!');
                        }
                        next(timer, eventID);
                    }
                }, interval);
            }, delay - interval > 0 ? (delay - interval) : delay );
        } else {
            jive.logger.debug("Skipping", eventID, "already running.");
        }
    }
    else {
        setTimeout( function() {
            var hasTimedOut = timeout ? new Date().getTime() - (lastRunTs[eventID] || 0) > timeout : false;
            if ( !exclusive || !running[eventID] || hasTimedOut ) {
                if (hasTimedOut ) {
                    jive.logger.debug(eventID,'timed out!');
                }
                next(undefined, eventID);
            }
        }, delay || 1);
    }
    jive.logger.debug("Scheduled task: " + eventID, interval || "immediate");

    return deferred.promise;
}
Scheduler.prototype.schedule = schedule;

/**
 * @memberof memoryScheduler
 * @param eventID
 * @returns {Object} Promise
 */
function unschedule(eventID){
    clearInterval(tasks[eventID]);
    delete tasks[eventID];
    return q.resolve();
}
Scheduler.prototype.unschedule = unschedule;

/**
 * @memberof memoryScheduler
 * @returns {Object} Promise
 */
function getTasks(){
    return Object.keys(tasks);
}
Scheduler.prototype.getTasks = getTasks;

/**
 * @memberof memoryScheduler
 * @param eventID
 * @returns {Object} Promise
 */
function isScheduled( eventID ) {
    var deferred = q.defer();
    if (tasks[eventID]) {
        deferred.resolve(true);
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
}
Scheduler.prototype.isScheduled = isScheduled;

/**
 * @memberof memoryScheduler
 * @returns {Object} Promise
 */
function shutdown(){
    var scheduler = this;
    eventHandlerMap = {};
    running = {};
    lastRunTs = {};
    this.getTasks().forEach(function(taskKey){
        scheduler.unschedule(taskKey);
    });

    return q.resolve();
}
Scheduler.prototype.shutdown =  shutdown;