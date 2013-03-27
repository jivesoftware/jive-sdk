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

/**
 * Created with IntelliJ IDEA.
 * User: matt
 * Date: 3/1/13
 * Time: 11:20 AM
 * To change this template use File | Settings | File Templates.
 */

var tasks = {};

/**
 * Schedule a task.
 * @param key String with which you'll identify this task later
 * @param interval The interval to invoke the callback
 * @param cb The callback
 */
exports.schedule = function schedule(key, interval, cb, context){
    if  (!cb) {
        return;
    }
    this.unschedule(key);
    tasks[key] = setInterval( function() { cb(context) }, interval);
    console.log("scheduled task: " + key);
};

exports.unschedule = function unschedule(key){
    if(tasks[key]){
        clearInterval(tasks[key]);
    }
};

exports.getTasks = function getTasks(){
    return Object.keys(tasks);
};

exports.shutdown = function(){
    var scheduler = this;
    this.getTasks().forEach(function(taskKey){
        scheduler.unschedule(taskKey);
    });
};