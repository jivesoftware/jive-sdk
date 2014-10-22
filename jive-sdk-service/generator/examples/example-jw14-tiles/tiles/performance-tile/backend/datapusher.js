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

var jive = require("jive-sdk"),
    lib = require("../../lib"),
    tileData = require("../definition.json").sampleData,
    defaultRanges = [ 1, 2000, 1500, 1000 ];

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

function pushData() {
    jive.tiles.findByDefinitionName('performance-tile')
      .then( function(instances) {
        if (instances) {
            instances.forEach(processTileInstance);
        }
      })
      .fail(function(error) {
        jive.logger.error(error);
      });
}

function processTileInstance(instance) {
  lib.getPerformance()
    .then(function(body) {
      var index = lib.getRangeIndex(instance.config.ranges || defaultRanges, body);
      pushSection(index, body);
    })
    .fail(function(error) {
      jive.logger.error(error);
      pushSection(0)
    });

  function pushSection(index, responseTime) {
    var label = tileData.sections[index].label;
    responseTime = responseTime ? responseTime + "ms" : "failure";
    var message = tileData.message + ": " + responseTime;
    jive.logger.info("update tile %s to index %d with label '%s' and message: %s",
      instance.id, index, label, message);
    var dataToPush = {
        data: {
            "message": message,
            "sections": tileData.sections,
            "activeIndex": index,
            "status": label,
            "action": {
                "text": "Discuss the current performance",
                "context": {
                  "responseTime": responseTime,
                  "level": index,
                  "label": label
                }
              }
        }
    };
    jive.tiles.pushData(instance, dataToPush);
  }
}
