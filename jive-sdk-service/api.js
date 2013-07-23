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
var logger = require('log4js').getLogger('jive-sdk');
logger.setLevel(process.env['jive_logging_level'] || 'INFO');
exports.logger = logger;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// routes
exports.routes = {
    'tiles' : require('./routes/tiles'),
    'jive' : require('./routes/jive'),
    'dev' : require('./routes/dev')
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// service
exports.service = require('./lib/api');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// from api
var api = require('../jive-sdk-api/api');
exports.persistence = api.persistence;
exports.scheduler = api.scheduler;
exports.tasks = api.tasks;
exports.extstreams = api.extstreams;
exports.tiles = api.tiles;
exports.events = api.events;
exports.util = api.util;
exports.coreV3 = api.coreV3;
exports.community = api.community;
exports.webhooks = api.webhooks;