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

var task = function( _runnable, _interval, _id ) {
    if ( !_runnable ) {
        throw 'A runnable function is required!';
    }

    return {
        'handler' : _runnable,
        'interval': _interval,
        'id'      : _id
    };
};

/**
 * API for managing recurrent tasks.
 * @module tasks
 */

/**
 * Schedules a recurrent task.
 * @param {function} handler Required. This function is invoked when the task scheduling condtions are met.
 * @param {number} interval Optional. Number of milliseconds in between recurrences of the handler being invoked.
 * @param {String} id Optional. Unique identifier for the task.
 * @returns {Object} a task object wrapping the provided parameters (handler, interval, id).
 */
exports.build = function(handler, interval, id) {
    return new task( handler, interval, id );
};

/**
 * @param {Object} task Required. Wrapper object for task characteristics.
 * @param {function} task.handler Required. This function is invoked when the task scheduling conditions are met.
 * @param {number} task.interval Optional. Number of milliseconds in between recurrences of the handler being invoked.
 * @param {String} task.id Optional. Unique identifier for the task.
 * @param {Object} scheduler Required. A scheduler strategy, similar to @see {@link memoryScheduler}.
 * @returns {Promise} Promise Promise .resolve and .reject handlers will be called depending on the success or failure of the handler
 * function when it is invoked.
 */
exports.schedule = function( task, scheduler ) {
    if ( !task || typeof task !== 'object' ) {
        throw Error("A task object is required.");
    }

    if ( !scheduler ) {
        throw Error("A scheduler is required.");
    }

    if ( typeof scheduler['schedule'] !== 'function' ) {
        throw Error("Invalid scheduler - requires a schedule function.");
    }

    var eventID = task['id'] || jive.util.guid();
    var context = { 'eventListener' : '__jive_system_tasks' };
    var interval = task['interval'];
    jive.events.registerEventListener( eventID, task['handler'], {
        'eventListener' : '__jive_system_tasks'
    });
    return scheduler.schedule(eventID, context, interval);
};
