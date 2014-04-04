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

var jive = require("jive-sdk");
var q = require('q');

/**
 * Handles actually pushing data to the tile instance
 * @param instance
 */
var processTileInstance = function(instance) {
    var date = new Date();
    var dataToPush = {
        "data": {
            "title": "Account Details",
            "contents": [
                {
                    "name": "Value",
                    "value": "Updated " + date.getTime()
                }
            ],
            action: {
                text: 'Share',
                'context':{
                    date:date
                }
            }
        }
    };

    jive.tiles.pushData(instance, dataToPush);
};

/**
 * Iterates through the tile instances registered in the service, and pushes an update to it
 */
var pushData = function() {
    var deferred = q.defer();
    jive.tiles.findByDefinitionName('{{{TILE_NAME}}}').then(function(instances) {
        if (instances) {
            q.all(instances.map(processTileInstance)).then(function() {
                deferred.resolve(); //success
            }, function() {
                deferred.reject(); //failure
            });
        } else {
            jive.logger.debug("No jive instances to push to");
            deferred.resolve();
        }
    });
    return deferred.promise;
};

/**
 * Schedules the tile update task to automatically fire every 10 seconds
 */
exports.task = [
    {
        'interval' : 10000,
        'handler' : pushData
    }
];

/**
 * Defines event handlers for the tile life cycle events
 */
exports.eventHandlers = [

    // process tile instance whenever a new one is registered with the service
    {
        'event' : jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : processTileInstance
    },

    // process tile instance whenever an existing tile instance is updated
    {
        'event' : jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : processTileInstance
    }
];


