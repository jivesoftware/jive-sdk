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
 * Main entrypoint of the Jive SDK API.<br>
 * Example Usage:
 * <pre>
 *      var jive = require('jive-sdk');
 *      jive.logger.info('Welcome!');
 * </pre>
 * @module api
 */

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// logging
var logger = require('log4js').getLogger('jive-sdk');
logger.setLevel(process.env['jive_logging_level'] || 'INFO');

/**
 * Instance of the default logger.
 * @property {function} debug example: require('jive-sdk').logger.debug('Debug message');
 * @property {function} info  example: require('jive-sdk').logger.debug('Info message');
 * @property {function} warn  example: require('jive-sdk').logger.debug('Warn message');
 * @property {function} fatal example: require('jive-sdk').logger.debug('Fatal message');
 * @property {function} error  example: require('jive-sdk').logger.debug('Error message');
 * @type {Logger}
 */
exports.logger = logger;

/**
 * An object containing the available default persistence strategies.<br>
 * <br><br>
 * Example Usage:<br>
 * <pre>
 *     var jive = require('jive-sdk');
 *     var persistence = new jive.persistence.memory();
 *     persistence.save( ... );
 * </pre>
 * @type {Object}
 * @property {filePersistence} file - File based persistence. @see {@link filePersistence} persistence.
 * @property {memoryPersistence} memory - Memory based persistence @see {@link memoryPersistence} persistence.
 */
exports.persistence = {
    'file' : require('./lib/persistence/file'),
    'memory' : require('./lib/persistence/memory')
};

/**
 * An object containing the available default scheduling strategy types.<br>
 * <br><br>
 * Example Usage:<br>
 * <pre>
 *     var jive = require('jive-sdk');
 *     var scheduler = new jive.scheduler.memory();
 *     ...
 *     ...
 *     scheduler.schedule( ... );
 * </pre>
 * @type {memoryScheduler}
 */
exports.scheduler = {
    'memory' : require('./lib/scheduler/scheduler')
};

/**
 * An object containing constant string values. @see {@link constants}.
 * @type module:constants
 */
exports.constants = require('./lib/util/constants.js');

/**
 * API for manipulating external streams and tiles (instances and definitions).
 * <br><br>
 * Example Usage:<br>
 * <pre>
 *     var jive = require('jive-sdk');
 *     jive.extstreams.findByID( ... );
 *     jive.extstreams.definitions.findByID( ... );
 * </pre>
 * @type module:extstreamsInstances
 * @property {extstreamsDefinitions} definitions - Stream definitions API.
 */
exports.extstreams = require('./lib/tile/extstreams');
exports.extstreams['definitions'] = require('./lib/tile/extstreamsDefinitions');

/**
 * API for manipulating tiles (instances and definitions).
 * <br>
 * Example Usage:<br>
 * <pre>
 *     var jive = require('jive-sdk');
 *     jive.tiles.findByID( ... );
 *     jive.tiles.definitions.findByID( ... );
 * </pre>
 * @type module:tileInstances
 * @property {tilesDefinitions} definitions - Tiles definitions API.
 */
exports.tiles = tiles = require('./lib/tile/tiles');
exports.tiles['definitions'] = require('./lib/tile/tilesDefinitions');

/**
 * API for managing events.
 * @type module:events
 */
exports.events = require( './lib/event/events');

/**
 * Useful general purpose utility functions.
 * <br>
 * Example Usage:<br>
 * <pre>
 *     var jive = require('jive-sdk');
 *     var guid = jive.util.guid();
 * </pre>
 * @type module:jiveutil
 */
exports.util = require('./lib/util/jiveutil');

/**
 * @deprecated
 * @type {Object}
 */
exports.oauthUtil = require('./lib/util/oauth');

/**
 * API for managing jive communities.
 * <br><br>
 * Example Usage:<br>
 * <pre>
 *     var jive = require('jive-sdk');
 *     jive.community.findByTenantID( '8sakjhdfee1' ).then( function(community) {
 *          jive.logger.info('Found',JSON.stringify(community));
 *     });
 * </pre>
 * @type module:community
 */
exports.community = require('./lib/community/community');

/**
 * API For managing service webhooks
 * @type module:webhooks
 */
exports.webhooks = require('./lib/webhook/webhooks');

/**
 * API for managing tasks.
 * @type module:tasks
 */
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

/**
 * Object that contains nominal API configuration state.
 * @type {Object}
 * @property {object} persistence - Configured persistence strategy.
 * @property {object} scheduler - Configured scheduler strategy.
 * @property {object} config - Configuration options.
 */
exports.context = {
    'persistence' :  createDefaultMethods( [ 'find', 'save', 'remove', 'findByID'], 'Undefined persistence'),
    'scheduler' : createDefaultMethods( [ 'init', 'schedule', 'unschedule', 'isScheduled', 'getTasks', 'shutdown'],
        'Undefined scheduler'),
    'config' : {}
};

//// this is PURELY for documentation purposes! we might need to reorganize this in the near future
/**
 * API for managing an SDK service.
 * @name service
 * @memberof module:api
 * @type module:service
 */

