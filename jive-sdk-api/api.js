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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// logging
var logger = require('log4js').getLogger('jive-sdk');
logger.setLevel(process.env['jive_logging_level'] || 'INFO');
exports.logger = logger;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// persistence
// - the different supported flavors are file, memory, and mongo
// - each strategy must expose find, save, remove methods
exports.persistence = {
    'file' : require('./lib/persistence/file'),
    'memory' : require('./lib/persistence/memory')
};

exports.scheduler  = {
    'memory' : require('./lib/scheduler/scheduler')
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Event name constants
exports.constants = require('./lib/util/constants.js');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// external streams and tiles (instances and definitions)
// eg. jive.tiles
//     jive.tiles.definitions
//     jive.extstreams
//     jive.extstreams.definitions

var extstreams = require('./lib/tile/extstreams');
extstreams['definitions'] = require('./lib/tile/extstreamsDefinitions');
exports.extstreams = extstreams;

var tiles = require('./lib/tile/tiles');
tiles['definitions'] = require('./lib/tile/tilesDefinitions');
exports.tiles = tiles;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// events
exports.events = require( './lib/event/events');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// util
exports.util = require('./lib/util/jiveutil');
exports.oauthUtil = require('./lib/util/oauthUtil');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For managing jive communities registered with this service
exports.community = require('./lib/community/community');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For managing service webhooks
exports.webhooks = require('./lib/webhook/webhooks');

// For creating tasks
exports.tasks = require('./lib/task/tasks');

var createDefaultMethods = function( methods, message ) {
    var object = {};
    methods.forEach( function( method ) {
        var methodFunction = function() {
            throw new Error(message);
        };
        object[method] = methodFunction;
    });
    return object;
};

// defaults - must be overridden
exports.context = {
    'persistence' :  createDefaultMethods( [ 'find', 'save', 'remove', 'findByID'], 'Undefined persistence'),
    'scheduler' : createDefaultMethods( [ 'init', 'schedule', 'unschedule', 'isScheduled', 'getTasks', 'shutdown'],
        'Undefined scheduler'),
    'config' : {}
};
