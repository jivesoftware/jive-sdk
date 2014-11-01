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
 * @module monitoringRoutes
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var url = require('url');
var http = require('http');
var q = require('q');
var jive = require("../api");

exports.ping = function( req, res ) {
    var monitoringResult = jive.service.monitoring().getStatus();
    if ( monitoringResult['status'] === 'ok' ) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
    } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
    }

    res.end(JSON.stringify(monitoringResult));
};

