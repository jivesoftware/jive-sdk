
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
var jive = require('../api');
var kue = require('kue');
var express = require('express');
var redis = require('redis').createClient();
var lock = require("redis-lock")(redis);

var jobs;
var tasks = {};

var taskExecutors = {};
var jobQueueName = "_defaultJobQueue";

function Scheduler(_jobQueueName) {
    jobs = kue.createQueue();
    if ( _jobQueueName ) {
        jobQueueName = _jobQueueName;
    }
    console.log("Redis Scheduler Initialized for queue", jobQueueName);
}

module.exports = Scheduler;

/**
 * Schedule a task.
 * @param key String with which you'll identify this task later
 * @param interval The interval to invoke the callback
 * @param cb The callback
 */
Scheduler.prototype.schedule = function schedule(task, key, interval, context, callback, exclusiveLock){
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

    this.unschedule(key);

    //////////////////////////////////////////////////////////////////////////////
    // scheduling
    //////////////////////////////////////////////////////////////////////////////

    var executionWrapper =  function() {

//        lock(key, 300 * 1000, function(done) {

            var jobID = jive.util.guid();
            jobs.create(jobQueueName, {
                'jobID' : jobID
            } )
            .save()
            .on('complete', function() {
                redis.get(jobID, function(err, reply) {
                    console.log("done", "reply:", reply);
                    if ( callback ) {
                        callback( reply );
                    }

//                    done();
                });
            });
//        } );

    };

    // schedule recurrent task
    if ( !jive.service.options.roles || !jive.service.options.roles['worker'] ) {
        if ( interval ) {
            // schedule for recurrent execution at some given interval
            tasks[key] = setInterval(executionWrapper, interval);
        } else {
            // schedule for execution, once -- right now
            executionWrapper();
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    // execution
    //////////////////////////////////////////////////////////////////////////////

    //
    // only workers get to execute
    //
    taskExecutors[key] = function(finalizer) {
        return cb(context, finalizer)
    };

    if ( jive.service.options.roles && jive.service.options.roles['worker'] ) {
        jobs.process(jobQueueName, 1, function(job, done) {
            console.log("executing...");
            var toExecute = taskExecutors[key];

            var sentinel = setTimeout( function() {
                    console.log("...executing...");
                },
                100
            );

            var finalize = function(result) {
                if( result ) {
                    redis.set(job.data.jobID, JSON.stringify(result), function() {
                        clearTimeout(sentinel);
                        done();
                    });
                }
            };

            toExecute( finalize );
        });
    }

    ////////////////////////////////////////////

    jive.logger.debug("Scheduled task: " + key, interval);

    return key;
};

Scheduler.prototype.unschedule = function unschedule(key){
    if(tasks[key]){
        clearInterval(tasks[key]);
        delete tasks[key];
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

//var lock = function( key, timeout, callback ) {
//
//
//
//};
