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

var jive = require("../../../jive-sdk");

/*
* This produces a task object with reasonable defaults.
* - At minimum, requires a runnable function
* - If an interval is not provided, defaults to 15 secs
* - Assigned a random string key by default, a different one can be set
*/

module.exports = function( _runnable, _interval, _context, _exclusiveLock ) {

    if ( !_runnable ) {
        throw 'A runnable function is required!';
    }

    var runnable = _runnable;
    var interval = _interval || 15000;
    var context = _context;
    var key = jive.util.guid();
    var exclusiveLock = _exclusiveLock;

    return {

        getInterval : function() {
            return interval;
        },

        getRunnable : function() {
            return runnable;
        },

        getContext : function() {
            return context;
        },

        setKey : function(_key) {
            key = _key;
        },

        getKey : function() {
            return key;
        },

        getExclusiveLock: function() {
            return exclusiveLock;
        }
    };
};