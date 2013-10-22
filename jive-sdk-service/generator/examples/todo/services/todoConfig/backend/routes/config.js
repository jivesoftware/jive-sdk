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
 * A simple REST service to store and retrieve todos from a file database.
 *
 * This is not meant for production use and only mean as a service to server
 * the example app.
 */

var jive = require('jive-sdk'),
    db = jive.service.persistence(),
    shared = require("../../../services/todoConfig/shared.js");

var update = function( todo, description ) {
    jive.events.emit("todoUpdate", todo, description);
};


var setConfig = function(req, res) {
    var jiveUrl = shared.getJiveURL(req);
    if( jiveUrl ) {
        db.save("todoConfig", jiveUrl, {jiveUrl: jiveUrl, clientid:req.body.clientid}).then(function() {
            res.status(200);
            res.set({'Content-Type': 'application/json'});
            res.send( "{\"status\": \"ok\"}");
        });

    } else {
        res.status(403);
        res.end();
    }
};

var getConfig = function(req, res) {
    shared.getClientIDForRequest(req).then(function(clientid) {
        res.status(200);
        res.set({'Content-Type': 'application/json'});
        res.send( JSON.stringify(
            {"clientid":  clientid || ""}));

    });
};

exports.postConfig = {
    'path' : 'config',
    'verb' : 'post',
    'route': setConfig
};

exports.getConfig = {
    'path' : 'config',
    'verb' : 'get',
    'route': getConfig
};