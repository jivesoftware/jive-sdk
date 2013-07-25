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
var jive = require('../api');

var redisClient;
var jobs;

///////////////////////////////////////////////////////////////////////////////////////////////
// helpers

/**
 * Create a closure around the handler
 * @param handler
 * @return {Function}
 */
var eventExecutor = function( handler ) {

    return function( job, done ) {
        var meta = job.data;
        var context = meta['context'];
        var jobID = meta['jobID'];
        var interval = job.data.interval;
        var eventID = meta['eventID'];

        var next = function() {
            if ( !interval ) {
                done();
                return;
            }

            // schedule new task if recurrent job, and is not already scheduled
            jive.service.scheduler().isScheduled(eventID).then( function (scheduled ) {
                if ( !scheduled ) {
                    // schedule a recurrent task
                    jobs.create(eventID, meta).delay(interval).save();
                }
            });

            done();
        };

        var promise = handler(context);
        if ( promise ){
            promise.then (
                // success
                function(result) {
                    redisClient.set(jobID, JSON.stringify({ 'result' : result }), function() {
                        next();
                    });
                },

                // error
                function(err) {
                    redisClient.set(jobID, JSON.stringify({ 'err' : err }), function() {
                        next();
                    });
                }
            );
        } else {
            // no promise ... we're immediately done
            next();
        }

    };
};

///////////////////////////////////////////////////////////////////////////////////////////////
// public

exports.init = function( eventHandlers ) {
    redisClient = require('redis').createClient();
    jobs = kue.createQueue();
    jobs.promote();

    for (var eventID in eventHandlers) {
        if ( eventHandlers.hasOwnProperty(eventID) ) {
            var eventHandler = eventHandlers[eventID];
            jobs.process( eventID, eventExecutor( eventHandler ) );
        }
    }
};
