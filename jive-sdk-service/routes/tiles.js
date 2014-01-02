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
 * These are global, publically available endpoints useful in the administration of the service
 * tiles, tile definitions, and other concerns.
 * @module tileRoutes
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var url = require('url');
var q = require('q');
var jive = require("../api");
var dev = require('./dev');

exports.unregister = function( req, res ) {
    var context = {
        'guid'          :   req.body['guid'],
        'remoteID'      :   req.body['id'],
        'name'          :   req.body['name'],
        'jiveUrl'       :   req.body['jiveUrl'],
        'tenantID'      :   req.body['tenantID'],
        'pushUrl'       :   req.body['url']
    };

    return jive.context.scheduler.schedule(jive.constants.tileEventNames.INSTANCE_UNREGISTRATION, context).then(
        function (result) {
            res.writeHead(204);
            res.end(JSON.stringify(result));
        },
        function (result) {
            var status = result.status || 500;
            res.writeHead(status);
            res.end(JSON.stringify(result));
        }
    );
};

exports.registration = function( req, res ) {
    var context = {
        'guid'          :   req.body['guid'],
        'remoteID'      :   req.body['id'],
        'config'        :   req.body['config'],
        'name'          :   req.body['name'],
        'jiveUrl'       :   req.body['jiveUrl'],
        'tenantID'      :   req.body['tenantID'],
        'pushUrl'       :   req.body['url'],
        'code'          :   req.body['code']
    };

    return jive.context.scheduler.schedule(jive.constants.tileEventNames.INSTANCE_REGISTRATION, context).then(
        function (result) {
            res.writeHead(200);
            res.end(JSON.stringify(result));
        },
        function (result) {
            var status = result.status || 500;
            res.writeHead(status);
            res.end(JSON.stringify(result));
        }
    );
};
