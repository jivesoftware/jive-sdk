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
function pushMeData(context) {
    return jive.tiles.pushData(context['instance'],
        {
            'data' : { 'my' : 'data' }
        }
    );
}

/**
 * Defines event handlers for the tile life cycle events
 */
exports.eventHandlers = [

    {
        'event' : 'pushMeData',
        'handler' : pushMeData
    }


];


