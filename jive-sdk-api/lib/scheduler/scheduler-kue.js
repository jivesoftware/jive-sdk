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
var kue = require('kue');
var express = require('express');

var jobs;
var tasks = {};

var taskExecutors = {};
var jobQueueName = "_defaultJobQueue";

function Scheduler(_jobQueueName) {
    jobs = kue.createQueue();
    jobs.promote();
    if ( _jobQueueName ) {
        jobQueueName = _jobQueueName;
    }
    console.log("Redis Scheduler Initialized for queue", jobQueueName);
}

module.exports = Scheduler;

/**
 * Schedule a task.
 * @param eventID the named event to fire to perform this task
 * @param context arguments to provide to the event handler
 * @param interval optional, time until this event should be fired again
 */
Scheduler.prototype.schedule = function schedule(eventID, context, interval){
    //generate a key for this job
    var key = jive.util.guid();
    //////////////////////////////////////////////////////////////////////////////
    // scheduling
    //////////////////////////////////////////////////////////////////////////////

    var executionWrapper =  function(key, interval) {
        var meta = {};
        meta['jobID'] = key;
        meta['eventID'] = eventID;
        meta['context'] = context;
        if (interval) {
            meta['interval'] = interval;
        }
        jobs.create(jobQueueName, meta).save();
    };

    // schedule recurrent task
    if ( interval ) {
        //put into queue, setting interval metadata
        executionWrapper(key, interval);
    } else {
        // schedule for execution once
        executionWrapper(key);
    }

    jive.logger.debug("Scheduled task: " + key, interval);

    return key;
};

Scheduler.prototype.unschedule = function unschedule(key){

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
