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
 * This is the main entry point of the api.
 */


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// logging
var logger = require('log4js').getLogger();
logger.setLevel(process.env['jive.logging.level'] || 'INFO');
exports.logger = logger;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// persistence
// - the different supported flavors are file, memory, and mongo
// - each strategy must expose find, save, remove methods
exports.persistence = {
    'file' : require('./lib/persistence/file'),
    'memory' : require('./lib/persistence/memory'),
    'mongo' : require('./lib/persistence/mongo')
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// external streams and tiles (instances and definitions)
// eg. jive.tiles
//     jive.tiles.definitions
//     jive.extstreams
//     jive.extstreams.definitions

var extstreams = require('./lib/extstreams');
extstreams['definitions'] = require('./lib/extstreamsDefinitions');
exports.extstreams = extstreams;

var tiles = require('./lib/tiles');
tiles['definitions'] = require('./lib/tilesDefinitions');
exports.tiles = tiles;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// events
exports.events = require( './lib/events');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// tasks
exports.tasks = require('./lib/tasks');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// util
exports.util = require('./lib/jiveutil');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// routes
exports.routes = require('./routes/tiles');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// service
exports.service = require('./service/api');

