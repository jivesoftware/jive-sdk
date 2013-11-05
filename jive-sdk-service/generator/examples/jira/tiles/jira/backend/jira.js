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

/*jshint laxcomma:true */

var request = require('request');
var jive = require('jive-sdk');

var baseurl = jive.service.options['jiraHost'] + "/rest/api/latest/";

function sortByFunction(filterName, sort) {
    return function(issues, callback) {
        if ( !issues ) {
            jive.logger.debug("no issues found");
            callback({}, filterName);
            return;
        }

        var groups = {};
        for(var i=0;i<issues.length;i++) {
            var field = sort(issues, i);
            if (field) {
                if (groups[(field)]) {
                    groups[(field)] += 1;
                } else {
                    groups[(field)] = 1;
                }
            }
        }
        callback(groups, filterName);
    }
}

exports.getData = function(filter, user, pass, sort, callback) {
    var auth = {
        'user':user,
        'pass':pass
    };

    request({
            'uri':baseurl+ "filter/" +filter,
            'auth':auth
        }, function (error, response, body) {
            if (error || response.statusCode < 200 || response.statusCode >= 300) {
                if (response) {
                    jive.logger.error("error getting filter at url:" + baseurl + "filter/"+filter
                        + "; error " + error,response.statusCode
                        + "; body " + body);
                } else {
                    jive.logger.error("error getting filter at url: " + baseurl + "filter/" + filter
                        + "; error " + error
                        + "; body " +body);
                }
            } else {
                body = JSON.parse(body);
                var filterName = body.name;
                var searchURL = body.searchUrl;
                request({
                    'uri':searchURL,
                    'auth':auth
                }, function(err, res, body) {
                    if (error || response.statusCode < 200 || response.statusCode >= 300) {
                        if (response) {
                            jive.logger.error("error getting filter: " +  error + " " +  response.statusCode + " " + body);
                        } else {
                            jive.logger.error("error getting filter: " + error + " " +  body);
                        }
                    } else {
                        processData(filterName, body, sort, callback);
                    }
                });
            }
        }
    );
};

function processData(filterName, body, sort, callback) {
    var issues = JSON.parse(body).issues;
    var sortfn;
    if (sort == "Severity") {
        sortfn = function (issues, i) {
            var field = issues[i].fields.customfield_10361;
            return field ? field[0].value : field;
        };
    } else if (sort == "Type") {
        sortfn = function (issues, i) {
            var field = issues[i].fields.issuetype;
            return field ? field.name : field;
        };
    } else if (sort == "Assignee") {
        jive.logger.debug("assignee sorted");
        sortfn = function (issues, i) {
            var field = issues[i].fields.assignee;
            return field ? field.displayName : field;
        };
    } else {
        sortfn = function (issues, i) {
            var field = issues[i].fields.status;
            return field ? field.name : field;
        };
    }

    sortByFunction(filterName, sortfn)(issues, callback);
}