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

var jobs;
var eventHandlers;
var queueName;

///////////////////////////////////////////////////////////////////////////////////////////////
// helpers

function oldJobKiller(activeJobs) {
    activeJobs.forEach(function(job) {
        var elapsed = ( new Date().getTime() - job['updated_at']);
//        jive.logger.debug(elapsed/1000, 'since update:',job['data']['eventID']);
        if (elapsed > job.data.timeout && job.data.eventID != 'jive.reaper') { //don't kill the reaper
            // jobs shouldn't be inactive for more than 20 seconds
            job.remove();
        }
    });
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

    var next = function() {
        if (liveNess) {
            clearInterval(liveNess);
        }
        if (meta['interval']) {
            jive.context.scheduler.searchTasks(eventID, ['inactive','delayed']).then(function(foundDelayed) {
                jive.context.scheduler.schedule(eventID, context, meta['interval'], null, function() {
                    if (foundDelayed.length != 0) {
                        foundDelayed.forEach(function(job) {
                            job.remove(); //remove older delayed jobs, like the backup we scheduled earlier
                            jive.logger.debug('cleaned up:', eventID);
                        });
                    }
                    else {
                        jive.logger.debug('cleaned up nothing', eventID);
                    }
                    done();
                });
            });
        }
        else {
            done();
        }
    };

    var liveNess = setInterval(function() {
        // update the job every 1 seconds to ensure liveness
        job.update();
    }, 1000);

    //schedule the next iteration right away so that if this node dies, we don't lose the job.
    //no matter what, when a new worker is brought in to replace a crashed worker, it will load any lost jobs from persistence.
    //if this is a one-time job, then there is no next iteration, it can just fail.
    if (meta['interval']) {
        jive.context.scheduler.searchTasks(eventID, ['active']).then(function(foundActives) {
            console.log(new Date(), 'active jobs:', eventID, foundActives.length, ';active job:',foundActives[0].id,';current job:', job.id);
            if (foundActives.length > 1 || (foundActives.length == 1 && foundActives[0].id != job.id)) {
                //we are an overlapping job. don't execute.
                console.log('not executing:', eventID);
                oldJobKiller(foundActives); //look for expired active jobs (remnants of a crashed worker) and remove them
                next();
            }
            else {
                jive.context.scheduler.searchTasks(eventID, ['delayed']).then(function(foundDelayed) {
                    if (foundDelayed.length == 0) {
                        jive.context.scheduler.schedule(eventID, context, meta['interval'], null, function() { //even if this worker crashes, this job will execute on another node.
                            runHandlers(job, eventID, tileName, context, next);
                        });
                    }
                    else {
                        runHandlers(job, eventID, tileName, context, next);
                    }
                });
            }
        });
    }
    else {
        runHandlers(job, eventID, tileName, context, next);
    }
}

function runHandlers(job, eventID, tileName, context, next) {
    var handlers;
    if (tileName) {
        var tileEventHandlers = eventHandlers[tileName];
        if (tileEventHandlers) {
            handlers = tileEventHandlers[eventID];
        }
    } else {
        handlers = eventHandlers[eventID];
    }

    if ( !handlers ) {
        // could find no handlers for the eventID; we're done
        next();
        return;
    }

    if ( typeof handlers === 'function' ) {
        // normalize single handler into an array
        handlers = [ handlers ];
    }

    var promises = [];
    handlers.forEach( function(handler) {
        try {
            var result = handler(context);
            if ( result && result['then'] ) {
                // its a promise
                promises.push( result );
            }
        } catch (e) {
            console.log(e);
        }
    });

    if ( promises.length > 0 ) {
        q.all( promises ).then(
            // success
            function(result) {
                if (result) {
                    // if just one result, don't bother storing an array
                    result = result['forEach'] && result.length == 1 ? result[0] : result;
                    job.data['result'] = { 'result' : result };
                    job.update( function() {
                        next();
                    });
                } else {
                    next();
                }
            },

            // error
            function(err) {
                jive.logger.error("Error!", err);
                job.data['result'] = { 'err' : err };
                job.update( function() {
                    next();
                });
            }
        ).done();
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
    jobs = kue.createQueue();
    jobs.promote(1000);
    jobs.process(queueName, options['concurrentJobs'] || 25, eventExecutor); //
};
