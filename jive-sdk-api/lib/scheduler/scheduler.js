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

var jive = require('../../api');

function Scheduler() {
}

module.exports = Scheduler;

var tasks = {};

var eventHandlerMap = {};

Scheduler.prototype.init = function init( _eventHandlerMap, options ) {
    eventHandlerMap = _eventHandlerMap;
};

/**
 * Schedule a task.
 * @param eventID which event to fire
 * @param context what to pass to the event
 * @param interval The interval to invoke the callback
 */
Scheduler.prototype.schedule = function schedule(eventID, context, interval) {
    var handler;
    if (context['tileName']) {
        handler = eventHandlerMap[context['tileName']][eventID];
    }
    else {
        handler = eventHandlerMap[eventID];
    }
    if (interval) {
        tasks[eventID] = setInterval(function() {
            handler(context)
        }, interval);
    }
    else {
        handler(context);
    }
    jive.logger.debug("Scheduled task: " + eventID, interval);
};

Scheduler.prototype.unschedule = function unschedule(eventID){
    if(this.isScheduled(eventID)) {
        clearInterval(tasks[eventID]);
        delete tasks[eventID];
    }
};

Scheduler.prototype.getTasks = function getTasks(){
    return Object.keys(tasks);
};

Scheduler.prototype.isScheduled = function( eventID ) {
    var deferred = q.defer();
    if (tasks[eventID]) {
        deferred.resolve(true);
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
};

Scheduler.prototype.shutdown = function(){
    var scheduler = this;
    this.getTasks().forEach(function(taskKey){
        scheduler.unschedule(taskKey);
    });
};