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

var jiveUtil = require('./jiveutil');

function Scheduler() {
}

Scheduler.prototype = Object.create({}, {
    constructor: {
        value: Scheduler,
        enumerable: false
    }
});

module.exports = Scheduler;

var tasks = {};

/**
 * Schedule a task.
 * @param key String with which you'll identify this task later
 * @param interval The interval to invoke the callback
 * @param cb The callback
 */
Scheduler.prototype.schedule = function schedule(task, key, interval, context){
    if  (!task) {
        return;
    }

    var cb = typeof task === 'function' ? task : undefined;
    if ( task.getRunnable ) {
        cb = task.getRunnable();
    }

    if ( !cb ) {
        return;
    }

    if ( task.getInterval ) {
        interval = task.getInterval();
    }

    if ( task.getKey ) {
        key = task.getKey();
    }

    if ( !key ) {
        key = jiveUtil.guid();
    }

    if ( !interval ) {
        interval = 15000;
    }

    this.unschedule(key);
    tasks[key] = setInterval( function() { cb(context) }, interval);
    console.log("Scheduled task: " + key, interval);
};

Scheduler.prototype.unschedule = function unschedule(key){
    if(tasks[key]){
        clearInterval(tasks[key]);
    }
};

Scheduler.prototype.getTasks = function getTasks(){
    return Object.keys(tasks);
};

Scheduler.prototype.shutdown = function(){
    var scheduler = this;
    this.getTasks().forEach(function(taskKey){
        scheduler.unschedule(taskKey);
    });
};