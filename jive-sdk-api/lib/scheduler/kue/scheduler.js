/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/x    licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var jive = require('../../../api');
var kue = require('kue');
var express = require('express');
var q = require('q');
var worker = require('./worker');
var redis = require('redis');

var jobs;
var redisClient;

var jobQueueName = 'work';
var pushQueueName = 'push';
var scheduleLocalTasks = false;

function Scheduler() {
}

module.exports = Scheduler;

///////////////////////////////////////////////////////////////////////////////////////////////
// helpers

var queueFor = function(eventID) {
    if (jive.events.pushQueueEvents.indexOf(eventID) != -1 ) {
        return pushQueueName;
    } else {
        return jobQueueName;
    }
};

var searchForJobs = function( queueName ) {
    var deferred = q.defer();
    var foundJobs = [];
    kue.Job.rangeByType(queueName, 'delayed', 0, 10, 'asc', function (err, delayedJobs) {
        if ( delayedJobs ) {
            foundJobs = foundJobs.concat( delayedJobs );
        }
        kue.Job.rangeByType(queueName, 'inactive', 0, 10, 'asc', function (err, inactiveJobs) {
            if ( inactiveJobs ) {
                foundJobs = foundJobs.concat( inactiveJobs );
            }
            kue.Job.rangeByType(queueName, 'active', 0, 10, 'asc', function (err, activeJobs) {
                if ( activeJobs ) {
                    foundJobs = foundJobs.concat( activeJobs );
                }

                foundJobs.forEach( function(job) {
                    var elapsed = ( new Date().getTime() - job.updated_at ) / 1000;
                    if ( elapsed > 60 && job.data.eventID != 'cleanupJobID') {
                        // jobs shouldn't run more than 60 seconds
                        console.log('job', job.id, 'expired, removing');
                        job.remove();
                    } else {
                        foundJobs.push( job );
                    }
                });
                deferred.resolve( foundJobs );
            });
        });
    });
    return deferred.promise;
};

///////////////////////////////////////////////////////////////////////////////////////////////
// public

Scheduler.prototype.init = function init( _eventHandlerMap, options ) {
    var self = this;
    var isWorker = !options || !options['role'] || options['role'] === jive.constants.roles.WORKER;
    var isPusher = !options || !options['role'] || options['role'] === jive.constants.roles.PUSHER;

    //set up kue. This is before the check for pusher/worker so that http nodes are able to post jobs to the queue.
    var opts = {};
    if (options.REDIS_LOCATION && options.REDIS_PORT) {
        opts['REDIS_LOCATION'] = options.REDIS_LOCATION;
        opts['REDIS_PORT'] = options.REDIS_PORT;
        redisClient = redis.createClient(options.REDIS_PORT, options.REDIS_LOCATION);
    }
    else {
        redisClient = redis.createClient();
    }
    kue.redis.createClient = function() {
        return redisClient;
    }
    jobs = kue.createQueue();
    jobs.promote(1000);

    if (!(isPusher || isWorker)) {
        // schedule no workers to listen on queued events if neither pusher nor worker
        return;
    }

    // kue specific cleanup job that should run periodically
    // to reap the job result records in redis
    _eventHandlerMap['cleanupJobID'] = function(context) {
        var deferred = q.defer();
        var jobID = context['jobID'];
        redisClient.del(jobID, function(err) {
            if (!err) {
                jive.logger.debug("Cleaned up", jobID);
                deferred.resolve();
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred;
    };

    if ( isWorker  ) {
        opts['queueName'] = jobQueueName;
        new worker().init(_eventHandlerMap, opts);
    }

    if ( isPusher  ) {
        opts['queueName'] = pushQueueName;
        new worker().init(_eventHandlerMap, opts);
    }

    scheduleLocalTasks = isWorker;

    // setup listeners
    jive.events.globalEvents.forEach( function(event) {
        jive.events.addLocalEventListener( event, function(context ) {
            self.schedule( event, context );
        });
    });

    jive.logger.info("Redis Scheduler Initialized for queue");
};

var localTasks = {};

function scheduleLocalRecurrentTask(delay, self, eventID, context, interval) {
    if ( !scheduleLocalTasks ) {
        return;
    }

    if ( localTasks[eventID] ) {
        jive.log.debug("Event", eventID, "already scheduled, skipping.");
        return;
    }

    setTimeout(function () {
        localTasks[eventID] = setInterval(function () {
            self.isScheduled(eventID).then(function (scheduled) {
                if (!scheduled) {
                    self.schedule(eventID, context, null, delay || interval);
                } else {
                    jive.logger.debug("Skipping schedule of " + eventID, " - Already scheduled");
                }
            });
        }, interval);
    }, delay || interval || 1);
}

/**
 * Schedule a task.
 * @param eventID the named event to fire to perform this task
 * @param context arguments to provide to the event handler
 * @param interval optional, time until this event should be fired again
 *
 * Returns a promise that gets invoked when the scheduled task has completed execution
 * only if its not a recurrent task
 */
Scheduler.prototype.schedule = function schedule(eventID, context, interval, delay) {
    var self = this;

    if ( interval ) {
        // if there is an interval, try to execute this task periodically
        // it will only fire if it isn't already running somewhere
        scheduleLocalRecurrentTask(delay, self, eventID, context, interval);
        return;
    }

    var deferred;

    if ( !interval ) {
        deferred = q.defer();
    }

    var meta = {};

    var jobID = jive.util.guid();
    meta['jobID'] = jobID;
    meta['eventID'] = eventID;
    meta['context'] = context;
    if (interval) {
        meta['interval'] = interval;
    }
    if ( delay ) {
        meta['delay'] = delay;
    }

    var job = jobs.create(queueFor(eventID), meta);
    if ( interval || delay ) {
        job.delay(interval && !delay ? interval : delay);
    }
    job.on('complete', function() {
        if ( !deferred ) {
            // cleanup
            redisClient.del(jobID);
            job.remove();
            // we're done if there is no promise to fulfill (e.g. tile pushes)
            return;
        }

        // once the job is done, retrieve any results that were cached on redis by some worker
        // then resolve or reject the promise accordingly.
        redisClient.get(jobID, function(err, jobResult) {
            if ( !err ) {
                deferred.resolve( jobResult ? JSON.parse(jobResult)['result'] : null );
            } else {
                if ( !jobResult ) {
                    deferred.resolve();
                } else {
                    var parsed = JSON.parse(jobResult);
                    if ( parsed['err'] ) {
                        deferred.reject(  parsed['err'] );
                    } else {
                        deferred.resolve( parsed['result']);
                    }
                }
            }

            // cleanup
            redisClient.del(jobID);
            job.remove();
        });
    });
    jive.logger.debug("Scheduled task: " + eventID, interval || '(no interval)');
    job.save();

    if (deferred) {
        return deferred.promise;
    }
};

Scheduler.prototype.unschedule = function unschedule(eventID){
    clearInterval(localTasks[eventID]);

    this.getTasks().forEach(function(job) {
        if (job.data['eventID'] == eventID) {
            job.remove();
        }
    });
};

/**
 * Returns a promise indicating if the event is already scheduled
 * @param eventID
 */
Scheduler.prototype.isScheduled = function(eventID) {
    var deferred = q.defer();

    this.getTasks().then( function( tasks ) {
        var found = false;
        for ( var i = 0; i < tasks.length; i++ ) {
            var job = tasks[i];
            if (job.data['eventID'] == eventID) {
                found = true;
                break;
            }
        }
        deferred.resolve( found );
    });

    return deferred.promise;
};

/**
 * Returns a promise which resolves with the jobs currently scheduled (recurrent or dormant)
 */
Scheduler.prototype.getTasks = function getTasks() {
    var foundJobs = [];

    return searchForJobs(jobQueueName).then( function(jobs) {
        if ( jobs && jobs.length > 0 ) {
            foundJobs = foundJobs.concat( jobs );
        }
        return searchForJobs(pushQueueName);
    }).then( function(pushJobs) {
        if ( pushJobs && pushJobs.length > 0  ) {
            foundJobs = foundJobs.concat( pushJobs );
        }
        return foundJobs;
    });
};

Scheduler.prototype.shutdown = function(){
    var scheduler = this;
    this.getTasks().forEach(function(job){
        scheduler.unschedule(job);
    });
};
