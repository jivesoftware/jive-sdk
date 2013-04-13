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

var events = require('events');

exports = module.exports = new events.EventEmitter();

exports.addEventListener = function( event, definitionName, listener ) {
    console.log("registered event " + event + " for " + definitionName );
    exports.addListener( event + "." + definitionName, listener );
};

/**
 * This is an array of events which will be applied to every autowired tile
 * @type {Array}
 */
exports.baseEvents = [
    {
        'event': 'newInstance',
        'handler' : function(theInstance){
            console.log("A new instance was created", theInstance);
        }
    },

    {
        'event': 'destroyingInstance',
        'handler' : function(theInstance){
            console.log("Instance is being destroyed", theInstance);
        }
    },

    {
        'event': 'destroyedInstance',
        'handler' : function(theInstance){
            console.log("Instance has been destroyed", theInstance);
        }
    },

    {
        'event': 'dataPushed',
        'handler' : function(theInstance, pushedData, response){
            console.log('Data push to', theInstance.url, response.statusCode, theInstance.name);
        }
    },

    {
        'event': 'activityPushed',
        'handler' : function(theInstance, pushedData, response){
            console.log('Activity push to', theInstance.url, response.statusCode, theInstance.name);
        }
    },

    {
        'event': 'commentPushed',
        'handler' : function(theInstance, pushedData, response){
            console.log('Comment push to', theInstance.url, response.statusCode, theInstance.name);
        }
    }
];

