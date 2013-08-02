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
 * This is a generic worker implementation.
 * You tell it what events it can respond to by passing an event - handler map
 * to its init method.
 * It can subscribe to many queues.
 */

var q = require('q');
var kue = require('kue');
var redis = require('redis');
var jive = require('../../../api');  // !! xxx todo is there an alternative to this????

function Worker() {
}

var redisClient;
var jobs;
var eventHandlers;
var queueName;

///////////////////////////////////////////////////////////////////////////////////////////////
// helpers

function scheduleCleanup(jobID) {
    function cleanup(jobID) {
        return function() {
            redisClient.del(jobID, function(err) {
                if (!err) {
                    jive.logger.debug("Cleaned up", jobID);
                }
                else {
                    jive.logger.debug("Error cleaning up", jobID);
                }
            });
        }
    };

    // cleanup the job in 30 seconds. somebody better have consumed the job result in 30 seconds
    //if this worker goes down during or before cleanup, a reaper task will do the cleanup eventually
    setTimeout(cleanup(jobID), 30*1000);
}

/**
 * run the job we took off the work queue
 */
function eventExecutor(job, done) {
    var meta = job.data;
    var context = meta['context'];
    var jobID = meta['jobID'];
    var eventID = meta['eventID'];
    var tileName = context['tileName'];
    jive.logger.debug('processing', jobID, ':', eventID);
    //schedule the next iteration right away so that if this node dies, we don't lose the job.
    //no matter what, when a new worker is brought in to replace a crashed worker, it will load any lost jobs from persistence.
    //if this is a one-time job, then we don't care about the next iteration, it can just fail.
    if (meta['interval']) {
        jive.context.scheduler.schedule(eventID, context, meta['interval']);
    }

    var next = function() {
        redisClient.set(eventID+':lastrun', new Date().getTime());
        scheduleCleanup(jobID);
        done();
    };

    //execute the job
    var handlers;
    if (tileName) {
        var tileEventHandlers = eventHandlers[tileName];
        if ( !tileEventHandlers ) {
            done();
            return;
        }
        handlers = tileEventHandlers[eventID];
    } else {
        handlers = eventHandlers[eventID];
    }

    if ( !handlers ) {
        // could find no handlers for the eventID; we're done
        done();
        return;
    }

    if ( typeof handlers === 'function' ) {
        // normalize single handler into an array
        handlers = [ handlers ];
    }

    var promises = [];
    handlers.forEach( function(handler) {
        var result = handler(context); //this actually runs the user code
        if ( result && result['then'] ) {
            // its a promise
            promises.push( result );
        }
    });

    if ( promises.length > 0 ) {
        q.all(promises).then(
            // success
            function(result) {
                if (result) {
                    // if just one result, don't bother storing an array
                    result = result['forEach'] && result.length == 1 ? result[0] : result;
                    if (result) { //need to check if the promise inside the array contained a value
                        redisClient.set(jobID, JSON.stringify({'result':result}), function() {
                            next();
                        });
                    }
                    else {
                        next();
                    }
                } else {
                    next();
                }
            },

            // error
            function(err) {
                redisClient.set(jobID, JSON.stringify({ 'err' : err }), function() {
                    next();
                });
            }
        );
    } else {
        next();
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////
// public
module.exports = Worker;

Worker.prototype.makeRedisClient = function(options) {
    if (options['redisLocation'] && options['redisPort']) {
        return redis.createClient(options['redisPort'], options['redisLocation']);
    }

    return redis.createClient();
};

Worker.prototype.init = function init(handlers, options) {
    eventHandlers = handlers;
    queueName = options['queueName'];
    var self = this;
    kue.redis.createClient = function() {
        return self.makeRedisClient(options);
    };
    redisClient = self.makeRedisClient(options);
    jobs = kue.createQueue();
    jobs.promote(1000);
    jobs.process(queueName, options['concurrentJobs'] || 100, eventExecutor);
};
