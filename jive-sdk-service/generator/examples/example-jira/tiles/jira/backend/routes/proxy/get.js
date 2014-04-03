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

var jive = require('jive-sdk');
var util = require('util');
var request = require('request');

exports.route = function(req, res) {
    jive.logger.debug("query:" + JSON.stringify(req.query) );
    request({
        'uri':req.query.url,
        'auth': {
            'user':req.query.user,
            'pass':req.query.pass
        }
    }, function(err, resp, body) {
        if (err) {
            jive.logger.error("error proxying request:" + req.query.url + JSON.stringify(err));
            jive.logger.error(body);
        }
        else {
            jive.logger.debug("returning" + body);
            res.send(body,200);
        }
    });

};