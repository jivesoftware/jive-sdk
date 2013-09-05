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

function shouldRun( meta ) {

    var eventID = meta['eventID'];
    var jobID = meta['jobID'];
    var exclusive = meta['exclusive'];

    if (!exclusive ) {
        return q.resolve(true);
    }

    return jive.context.scheduler.searchTasks(eventID).then( function(tasks) {
        var runningJob;

        for ( var i = 0; i < tasks.length; i++ ) {
            var task = tasks[i];
            if ( task['data']['jobID'] !== jobID  ) {
                runningJob = task['data']['jobID'] + " : " + task['data']['eventID'];
                break;
            }

        }

        return !runningJob;
    } );
}

/**
 * run the job we took off the work queue
 */
function eventExecutor(job, done) {
    var meta = job.data;

    shouldRun(meta).then( function(shouldRun) {

        var context = meta['context'];
        var eventID = meta['eventID'];
        var tileName = context['tileName'];

        if ( !shouldRun ) {
            jive.logger.debug("Execution aborted: " + JSON.stringify(meta,4 ));
            done();
            return;
        }

        var next = function() {
            if ( liveNess ) {
                clearTimeout(liveNess);
            }
            redisClient.set( eventID + ':lastrun', new Date().getTime(), function() {
                done();
            });
        };

        var liveNess = setInterval( function() {
            // update the job every 1 seconds to ensure liveness
            job.update();
        }, 1000);

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
            var result = handler(context);
            if ( result && result['then'] ) {
                // its a promise
                promises.push( result );
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
    });
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
