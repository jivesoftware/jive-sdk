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

module.exports = Task;

this.interval = 15000;
this.runnable = function() {};
this.context = null;
this.key = '';

function Task(_runnable, _interval, _context ) {
    this.runnable = _runnable;
    this.interval = _interval ? _interval : 15000;
    this.context = _context;
}

Task.prototype = Object.create({}, {
    constructor: {
        value: Task,
        enumerable: false
    }
});

Task.prototype.getInterval = function() {
    return this.interval;
};

Task.prototype.getRunnable = function() {
    return this.runnable;
};

Task.prototype.getContext = function() {
    return this.context;
};

Task.prototype.setKey = function(_key) {
    this.key = _key;
};

Task.prototype.getKey = function() {
    return this.key;
};

