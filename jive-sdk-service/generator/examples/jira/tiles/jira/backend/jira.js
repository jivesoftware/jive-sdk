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

var filterName;

function sortByFunction(sort) {
    return function(issues, callback) {
        if ( !issues ) {
            console.log("no issues found");
            callback({}, filterName);
            return;
        }

        var groups = {};
        for(var i=0;i<issues.length;i++) {
            var field = sort(issues, i);
            if (field) {
                if (groups[(field)]) {
                    groups[(field)] += 1;
                }
                else {
                    groups[(field)] = 1;
                }
            }
            else {
                console.log((field)+"field not found: ", JSON.stringify(issues[i].fields));
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
            'uri':baseurl+"filter/"+filter,
            'auth':auth
        }, function (error, response, body) {
            if (error || response.statusCode < 200 || response.statusCode >= 300) {
                if (response) {
                    console.log("error getting filter at url:",baseurl+"filter/"+filter,"error",error,response.statusCode,"body",body);
                }
                else {
                    console.log("error getting filter at url:",baseurl+"filter/"+filter,"error",error,"body",body);
                }
            }
            else {
                //console.log(body);
                body = JSON.parse(body);
                filterName = body.name;
                var searchURL = body.searchUrl;
                request({
                    'uri':searchURL,
                    'auth':auth
                }, function(err, res, body) {
                    if (error || response.statusCode < 200 || response.statusCode >= 300) {
                        if (response) {
                            console.log("error getting filter:", error, response.statusCode, body);
                        }
                        else {
                            console.log("error getting filter:", error, body);
                        }
                    }
                    else {
                        processData(body, sort, callback);
                    }
                });
            }
        }
    );
}

function processData(body, sort, callback) {
    var issues = JSON.parse(body).issues;
    var sortfn;
    if (sort == "Severity") {
        sortfn = function (issues, i) {
            var field = issues[i].fields.customfield_10361;
            if (field) {
                return field[0].value;
            }
            else {
                return field;
            }
        }
//                            sortBySeverity(issues, callback);
    }
    else if (sort == "Type") {
        sortfn = function (issues, i) {
            var field = issues[i].fields.issuetype;
            if (field) {
                return field.name;
            }
            else {
                return field;
            }
        }
//                            sortByType(issues, callback);
    }
    else if (sort == "Assignee") {
        console.log("assignee sorted");
        sortfn = function (issues, i) {
            var field = issues[i].fields.assignee;
            if (field) {
                return field.displayName;
            }
            else {
                return field;
            }
        }
    }
    else {
        sortfn = function (issues, i) {
            var field = issues[i].fields.status;
            if (field) {
                return field.name;
            }
            else {
                return field;
            }
        }
//                            sortByStatus(issues, callback);
    }
    sortByFunction(sortfn)(issues, callback);
}