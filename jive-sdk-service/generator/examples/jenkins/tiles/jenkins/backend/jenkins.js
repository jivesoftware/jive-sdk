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

https = require('https');
url = require('url');
jive = require('jive-sdk');

var Jenkins = function() {
    this.getData = getData;
    this.request = request;
};

function request(urlstr, callback) {
    var options = {};
    options.rejectUnauthorized = false;

    jive.util.buildRequest( urlstr, "GET", null, null, options).then( function(response) {
        callback( response.entity);
    });
}

function getData(jobswanted, viewswanted, tilecallback) {
    var base_url = 'https://jenkins.jiveland.com';
    function getViewJobs(wantedViews, callback) {
        if (wantedViews.length > 0) {
            request(base_url+'/view/'+wantedViews.pop()+'/api/json', function(viewdata) {
                var viewjobs = viewdata.jobs;
                for(var j=0;j<viewjobs.length;j++) {
                    if (jobswanted.indexOf(viewjobs[j]) < 0) {
                        jobswanted.push(viewjobs[j]);
                    }
                }
                getViewJobs(wantedViews, callback);
            });
        }
        else {
            callback();
        }
    }

    function getJobs() {
        request(base_url+'/api/json', function(data) {
            var alljobs = data.jobs;
            var jobData = {};
            function getJobData(wanted, callback) {
                if(wanted.length > 0) {
                    var job = wanted.pop();
                    if (job.name && job.url && job.color) {
                        if (job.color == 'red') {
                            jobData[job.name] = job;
                        }
                    }
                    else {
                        var found = alljobs[binarySearch(job, alljobs)];
                        if (found.color == 'red') {
                            jobData[job] = found;
                        }
                    }
                    getJobData(wanted, callback);
                }
                else {
                    callback(jobData);
                }
            }
            getJobData(jobswanted, tilecallback)
        });
    }

    if ( viewswanted.length > 0 ) {
        getViewJobs(viewswanted, getJobs);
    } else {
        getJobs();
    }
}

// because the array jenkins stores is in alphabetical order, we can do binary search
function binarySearch(string, array, startIndex) {
    if (!startIndex) {
        startIndex = 0;
    }
    if (array.length < 1) {
        return -1;
    }
    var middle = Math.floor(array.length/2);
    var middleName = array[middle].name;
    if (middleName == string) {
        return startIndex+middle;
    }
    else if (array.length == 1) {
        return -1;
    }
    else if (string.toLowerCase() < middleName.toLowerCase()) {
        return binarySearch(string, array.slice(0,middle), startIndex);
    }
    else {
        return binarySearch(string, array.slice(middle+1, array.length), startIndex+middle+1);
    }
}

exports.Jenkins = Jenkins;
