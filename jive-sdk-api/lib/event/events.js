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
var jive = require('../../api');

exports = module.exports = new events.EventEmitter();

exports.addDefinitionEventListener = function( event, definitionName, handler, description ) {
    var eventID = event + "." + definitionName;
    jive.logger.debug("Registered event for", definitionName,": '" + event + "' ", description ||'' );
    exports.addListener( eventID, handler );
};

/**
 * This is an array of events which will be applied to every autowired tile
 * @type {Array}
 */
exports.baseEvents = [
    {
        'event': 'newInstance',
        'handler' : function(theInstance){
            jive.logger.info("A new instance was created", theInstance);
        },
        'description' : 'Framework handler'
    },

    {
        'event': 'destroyingInstance',
        'handler' : function(theInstance){
            jive.logger.info("Instance is being destroyed", theInstance);
        },
        'description' : 'Framework handler'
    },

    {
        'event': 'destroyedInstance',
        'handler' : function(theInstance){
            jive.logger.info("Instance has been destroyed", theInstance);
        },
        'description' : 'Framework handler'
    },

    {
        'event': 'dataPushed',
        'handler' : function(theInstance, pushedData, response){
            jive.logger.info('Data push to', theInstance.url, response? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },

    {
        'event': 'activityPushed',
        'handler' : function(theInstance, pushedData, response){
            jive.logger.info('Activity push to', theInstance.url, response? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },

    {
        'event': 'commentPushed',
        'handler' : function(theInstance, pushedData, response){
            jive.logger.info('Comment push to', theInstance.url, response? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    }
];