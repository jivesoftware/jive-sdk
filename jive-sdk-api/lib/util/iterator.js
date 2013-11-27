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

var q = require('q');
var ArrayStream = require('stream-array');

exports.createForCursor = function(cursor, itemProcessor, options) {
    var p = q.defer();
    var results = {
        'completed' : 0
    };
    options = options || {};

    var uniformLaunchMs = options['uniformLaunchMs'];
    var serial = options['serial'];
    var wave = options['wave'];
    if ( wave ) {
        var wavePause = wave['pauseMs'];
        var wavePauseAfterCount = wave['pauseAfterCompletedCount'];

        if ( !wavePauseAfterCount || !wavePauseAfterCount) {
            throw new Error("pauseMs and pauseAfterCompletedCount are required fields for wave");
        }
    }
    var executionStartTs = new Date().getTime();
    var waveExecCount = 0;

    function duration(ts) {
        return new Date().getTime()  - ts;
    }

    function calculateTimeout() {
        var nextTimeout = 0;
        if (wave) {
            if (wavePauseAfterCount) {
                if (waveExecCount > wavePauseAfterCount) {
                    nextTimeout = wavePause;
                    // reset
                    waveExecCount = 0;
                } else {
                    waveExecCount++;
                }
            }
        }
        return nextTimeout;
    }

    function processItem(err, item) {
        if ( err ) {
            p.reject(err);
            return;
        }

        if ( item === null ) {
            results['executionTimeMs'] = duration(executionStartTs);
            p.resolve(results);
            cursor = null;
            return;
        }


        var nextTimeout = Math.max(calculateTimeout(), uniformLaunchMs || 0 );
        setTimeout( function() {
            var processorResult = itemProcessor(item);
            if ( serial && processorResult ) {
                processorResult.then( function() {
                    results['completed']++;
                    waveExecCount++;
                    cursor.next(processItem);
                } );
            } else {
                results['completed']++;
                waveExecCount++;
                cursor.next(processItem);
            }
        }, Math.max(nextTimeout, 1) );
    }

    cursor.next(processItem);

    return p.promise;
};

exports.createForArray = function(array, itemProcessor, options) {
    var stream = ArrayStream(array);
    // graft next method
    stream.nextCtr = 0;
    stream.fullCollection = array;
    stream.next = function(processorFunction) {
        if ( !processorFunction ) {
            throw new Error("Requires processor function");
        }
        this.nextCtr++;
        if ( this.nextCtr > this.fullCollection.length - 1 ) {
            processorFunction(null, null);
        } else {
            processorFunction(null, this.fullCollection[this.nextCtr]);
        }
    };

    return exports.createForCursor( stream, itemProcessor, options);
};
