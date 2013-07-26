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

var kue = require('kue');
var jive = require('../../../api');  // !! xxx todo is there an alternative to this????

var redisClient;
var jobs;
var eventHandlers;
var queueName;

///////////////////////////////////////////////////////////////////////////////////////////////
// helpers

/**
 * run the job we took off the work queue
 * @param handler
 * @return {Function}
 */
function eventExecutor(job, done) {
    var meta = job.data;
    var context = meta['context'];
    var jobID = meta['jobID'];
    var interval = job.data.interval;
    var eventID = meta['eventID'];
    var tileName = context['tileName'];

    var next = function() {
        if (!interval) {
            done();
            return;
        }

        // schedule new task if recurrent job, and is not already scheduled
        jive.context.scheduler.isScheduled(eventID).then( function (scheduled ) {
            if ( !scheduled ) {
                // schedule a recurrent task
                jobs.create(queueName, meta).delay(interval).save();
            }
        });

        done();
    };

    var handler;
    if (tileName) {
        handler = eventHandlers[tileName][eventID];
    }
    else {
        handler = eventHandlers[eventID];
    }

    if ( !handler ) {
        // could find no handler for the eventID
        // we're done
        done();
        return;
    }

    var result = handler(context);
    if ( !result ) {
        // no result ... we're immediately done
        next();
    } else {
        if ( result['then'] ) {
            // its a promise
            var promise = result;
            promise.then(
                // success
                function(result) {
                    if (result) {
                        redisClient.set(jobID, JSON.stringify({ 'result' : result }), function() {
                            next();
                        });
                    }
                    else {
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
            // its not a promise - save the result
            redisClient.set(jobID, JSON.stringify({ 'result' : result }), function() {
                next();
            });
        }
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////
// public

exports.init = function(_queueName, handlers) {
    queueName = _queueName;
    redisClient = require('redis').createClient();
    jobs = kue.createQueue();
    jobs.promote();

    eventHandlers = handlers;
    jobs.process(queueName, eventExecutor);
};
