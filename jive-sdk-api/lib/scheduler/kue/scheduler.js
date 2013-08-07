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

function Scheduler(options) {
}

module.exports = Scheduler;

///////////////////////////////////////////////////////////////////////////////////////////////
// private helpers

var queueFor = function(eventID) {
    if (jive.events.pushQueueEvents.indexOf(eventID) != -1 ) {
        return pushQueueName;
    } else {
        return jobQueueName;
    }
};

var removeJob = function( job ) {
    var deferred = q.defer();
    job.remove(function() {
        jive.logger.debug('job', job.id, job['data']['eventID'], 'expired, removed');
        deferred.resolve();
    });

    return deferred.promise;
};

/**
 * Return all jobs in the given queue that have one of the given states.
 * @param queueName - name of the queue
 * @param types - array of strings containing the job statuses we want (e.g. ['delayed']).
 * @returns a promise for an array of jobs.
 */
var searchJobsByQueueAndTypes = function(queueName, types) {
    var deferred = q.defer();
    if (!types) {
        types = ['delayed','active','inactive'];
    }
    if (!types.forEach) {
        types = [types];
    }
    var promises = [];
    types.forEach(function(type) {
        var defer = q.defer();
        promises.push(defer.promise);
        kue.Job.rangeByType(queueName, type, 0, 1, 'asc', function(err,jobs) {
            if (err) {
                defer.reject(err);
            }
            else {
                defer.resolve(jobs);
            }
        });
    });
    q.all(promises).then(function(jobArrays) {
        deferred.resolve(jobArrays.reduce(function(prev, curr) {
            return prev.concat(curr);
        }, []));
    }, function(err) {
        deferred.reject(err);
    });
    return deferred.promise;
};

var findTaskInSet = function(eventID, tasks) {
    var found = false;
    for ( var i = 0; i < tasks.length; i++ ) {
        var job = tasks[i];
        if (job.data['eventID'] == eventID) {
            found = true;
            break;
        }
    }
    return found;
}

/**
 * Return all currently delayed and active jobs.
 * If we come across an old active job, get rid of it.
 * @param queueName
 * @returns {Function}
 */
var searchForJobs = function( queueName ) {
    var deferred = q.defer();
    var foundJobs = [];
    kue.Job.rangeByType(queueName, 'delayed', 0, 1, 'asc', function (err, delayedJobs) {
        if ( delayedJobs ) {
            foundJobs = foundJobs.concat( delayedJobs );
        }
//        kue.Job.rangeByType(queueName, 'inactive', 0, 1, 'asc', function (err, inactiveJobs) {
//            if ( inactiveJobs && inactiveJobs.length > 0 ) {
//                foundJobs = foundJobs.concat( inactiveJobs );
//            }
            kue.Job.rangeByType(queueName, 'active', 0, 1, 'asc', function (err, activeJobs) {
                activeJobs = activeJobs || [];

                var promises = [];

                activeJobs.forEach( function(job) {
                    var elapsed = ( new Date().getTime() - job.updated_at ) / 1000;
                    jive.logger.debug(elapsed, 'since update:',job['data']['eventID']);
                    if ( elapsed > 20 && job.data.eventID != 'jive.reaper') { //don't kill the reaper
                        // jobs shouldn't be inactive for more than 20 seconds
                        promises.push( removeJob( job ));
                    } else {
                        foundJobs.push( job );
                    }
                });

                if ( promises.length > 0 ) {
                    promises.reduce(q.when, q()).then( function() {
                        deferred.resolve( foundJobs );
                    }, function() {});
                } else {
                    deferred.resolve( foundJobs );
                }

            });
//        });
    });
    return deferred.promise;
};

var setupKue = function(options) {
    //set up kue, optionally with a custom redis location.
    redisClient = new worker().makeRedisClient(options);
    kue.redis.createClient = function() {
        return new worker().makeRedisClient(options);
    };
    jobs = kue.createQueue();
    jobs.promote(1000);
    return options;
};

function setupCleanupTasks(_eventHandlerMap) {
    // kue specific cleanup job that should run periodically
    // to reap the job result records in redis
    _eventHandlerMap['jive.reaper'] = function() {
        var deferred = q.defer();

        jive.logger.info("Running reaper");
        kue.Job.rangeByState('complete', 0, 2000, 'asc', function (err, jobs) {
            var promises = [];
            if ( jobs ) {
                jobs.forEach( function(job) {
                    var elapsed = ( new Date().getTime() - job.created_at ) / 1000;
                    if ( elapsed > 30) {
                        // if completed more than 5 seconds ago, nuke it
                        promises.push( removeJob(job) );
                    }
                });
            }

            if ( promises.length > 0 ) {
                promises.reduce(q.when, q()).then( function() {
                    jive.logger.info("Cleaned up", promises.length);
                    deferred.resolve();
                }, function() {});
            } else {
                jive.logger.info("Cleaned up nothing");
                deferred.resolve();
            }
        });

        return deferred;
    };
}

///////////////////////////////////////////////////////////////////////////////////////////////
// public

/**
 * Initialize the scheduler
 * @param _eventHandlerMap - an object that trasnlates eventIDs into functions to run
 * @param serviceConfig - configuration options such as the location of the redis server.
 */
Scheduler.prototype.init = function init( _eventHandlerMap, serviceConfig ) {
    var self = this;
    var isWorker = !serviceConfig || !serviceConfig['role'] || serviceConfig['role'] === jive.constants.roles.WORKER;
    var isPusher = !serviceConfig || !serviceConfig['role'] || serviceConfig['role'] === jive.constants.roles.PUSHER;

    var opts = setupKue(serviceConfig);
    if (!(isPusher || isWorker)) {
        // schedule no workers to listen on queued events if neither pusher nor worker
        return;
    }

    setupCleanupTasks(_eventHandlerMap);

    if ( isWorker  ) {
        opts['queueName'] = jobQueueName;
        new worker().init(_eventHandlerMap, opts);
    }

    if ( isPusher  ) {
        opts['queueName'] = pushQueueName;
        new worker().init(_eventHandlerMap, opts);
    }

    // setup listeners
    jive.events.globalEvents.forEach( function(event) {
        jive.events.addLocalEventListener( event, function(context ) {
            self.schedule( event, context ); //todo maybe add a check for already scheduled?
        });
    });

    // schedule a periodic repear task
    self.isScheduled('jive.reaper').then(function(found) {
        if (!found) {
            self.schedule('jive.reaper', {}, 10 * 1000 );
        }
    });

    jive.logger.info("Redis Scheduler Initialized for queue");
};

/**
 * Schedule a task.
 * If this is invoked, the task WILL get scheduled (no checks for duplicates)
 * @param eventID the named event to fire to perform this task
 * @param context arguments to provide to the event handler
 * @param interval optional, time until this event should be fired again
 *
 * Returns a promise that gets invoked when the scheduled task has completed execution
 * only if its not a recurrent task
 */
Scheduler.prototype.schedule = function schedule(eventID, context, interval, delay) {
    var deferred = q.defer();
    var jobID = jive.util.guid();
    var meta = {
        'jobID' : jobID,
        'eventID' : eventID,
        'context' : context
    };
    if (interval) {
        meta['interval'] = interval;
    }
    if ( delay ) {
        meta['delay'] = delay;
    }

    var job = jobs.create(queueFor(eventID), meta);
    if (interval || delay) {
        job.delay(interval && !delay ? interval : delay);
    }
    job.on('complete', function() {
        // once the job is done, retrieve any results that were cached on redis by some worker
        // then resolve or reject the promise accordingly.

        kue.Job.get( job.id, function( err, latestJobState ) {
            if ( !latestJobState ) {
                deferred.resolve();
                return;
            }
            var jobResult = latestJobState['data']['result'];
            if ( !err ) {
                deferred.resolve( jobResult ? jobResult['result'] : null );
            } else {
                if (!jobResult) {
                    deferred.resolve();
                } else {
                    var parsed = JSON.parse(jobResult);
                    if (parsed['err']) {
                        deferred.reject(parsed['err']);
                    } else {
                        deferred.resolve(parsed['result']);
                    }
                }
            }
        });
    });
    jive.logger.debug("Scheduled task: " + eventID, interval || '(no interval)');
    job.save();

    return deferred.promise;
};

/**
 * Remove the task from the queue.
 * @param eventID
 */
Scheduler.prototype.unschedule = function unschedule(eventID){
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
    this.getTasks().then(function(tasks) {
        deferred.resolve(findTaskInSet(eventID, tasks));
    });
    return deferred.promise;
};

/**
 * Search only tasks with one of the given statuses for a task with the given eventID.
 * @param eventID - task to search for
 * @param statuses - array of strings containing the job statuses we want (e.g. ['delayed']).
 * @returns {*}
 */
Scheduler.prototype.searchTasks = function(eventID, statuses) {
    var deferred = q.defer();
    searchJobsByQueueAndTypes(queueFor(eventID), statuses).then(function(tasks) {
        deferred.resolve(findTaskInSet(eventID, tasks));
    });
    return deferred.promise;
}

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
