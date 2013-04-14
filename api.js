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
// persistence
exports.persistence = {
    'file' : require('./persistence/file'),
    'memory' : require('./persistence/memory'),
    'mongo' : require('./persistence/mongo')
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// configuration
exports.config = require('./lib/config');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// external streams and tiles (instances and definitions)
// eg. jive.tiles
//     jive.tiles.definitions
//     jive.extstreams
//     jive.extstreams.definitions

var eventRegistry = require( './tile/registry');

var extstreamsDefinitions = require('./lib/extstreamsDefinitions');
var extstreams = new (require('./lib/extstreams'));
extstreams['definitions'] = new extstreamsDefinitions();
extstreams['events'] = eventRegistry;
exports.extstreams = extstreams;

var tileDefinitions = require('./lib/tilesDefinitions');
var tiles = new (require('./lib/tiles'));
tiles['definitions'] = new tileDefinitions();
tiles['events'] = eventRegistry;
exports.tiles = tiles;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// events
exports.events = eventRegistry;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// tasks
exports.tasks = require('./lib/tasks');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// util
exports.util = require('./lib/jiveutil');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// autowire
exports.autowire = require('./autowire/api');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// routes
exports.routes = require('./routes/tiles');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// applications xxx todo -- this might not be necessary in the api
exports.applications = new (require('./lib/applications'));
