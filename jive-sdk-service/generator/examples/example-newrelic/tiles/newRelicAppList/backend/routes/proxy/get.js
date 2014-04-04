/*
 * Copyright 2013 Jive Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var jive = require('jive-sdk');
var util = require('util');
var request = require('request');
var newRelic = require( '../../newRelic')  ;

exports.route = function(req, res) {
    console.log("proxy/get, query:"+JSON.stringify(req.query));

    var apioptions=jive.service.options['api-newrelic']    ;
    var api_key = apioptions['api-key'] ;

    newRelic.getApplications().then(
            function(data) {
                // success
                var json = JSON.stringify(data)
                console.log("returning", json)
                res.send(json,200);
            },
            function(err) {
                // failure
                console.log("error proxying request:", req.query.url, JSON.stringify(err));
                console.log(err);
            });

};