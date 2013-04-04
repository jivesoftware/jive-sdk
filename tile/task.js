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

var events = require('events');

module.exports = Task;

var interval = 15000;
var runnable = function() {};

function Task(_runnable, _interval ) {
    events.EventEmitter.call(this);
    runnable = _runnable;
    interval = _interval ? _interval : 15000;
}

Task.super_ = events.EventEmitter;
Task.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Task,
        enumerable: false
    }
});

Task.prototype.getInterval = function() {
    return interval;
};

Task.prototype.getRunnable = function() {
    return runnable;
};