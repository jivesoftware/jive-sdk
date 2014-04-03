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
$(document).ready( function() {
    jive.tile.onOpen(function(config, options) {
        var selectedJobs = {};
        var selectedViews = {};

        function jobsalerts(item) {
            var itemtag = item.replace(/ /g,"-");
            selectedJobs[item] = true;
            if($("#alert-"+itemtag).length) {
                console.log("already in list:", itemtag);
                return;
            }
            $("#added-jobs").append('<div class="alert" id="alert-' + itemtag + '"><button type="button" class="close" data-dismiss="alert">x</button>' + item + '</div>');
            $("#alert-" + itemtag).bind('close', function () {
                selectedJobs[item] = false;
                console.log("closing", item, selectedJobs[item]);
                gadgets.window.adjustHeight();
            });
            gadgets.window.adjustHeight();
        }

        function viewsalerts(item) {
            var itemtag = item.replace(/ /g,"-");
            selectedViews[item] = true;
            if($("#alert-"+itemtag).length) {
                console.log("already in list:", itemtag);
                return;
            }
            $("#added-jobs").append('<div class="alert alert-info" id="alert-' + itemtag + '"><button type="button" class="close" data-dismiss="alert">x</button>' + item + '</div>');
            $("#alert-" + itemtag).bind('close', function () {
                selectedViews[item] = false;
                console.log("closing", item, selectedViews[item]);
                gadgets.window.adjustHeight();
            });
            gadgets.window.adjustHeight();
        }

        if (config.views) {
            for (var i=0;i<config.views.length;i++) {
                viewsalerts(config.views[i]);
            }
        }
        if (config.jobs) {
            for (var i=0;i<config.jobs.length;i++) {
                jobsalerts(config.jobs[i]);
            }
        }

        var newConfig= {};

        function getJobs() {
            osapi.http.get({
                'href' : host + '/jobs',
                'format' : 'json'
            }).execute(function(response){
                    if ( response.status >= 400 && response.status <= 599 ) {
                        alert("ERROR!"+JSON.stringify(response.content));
                        return;
                    }

                    var data = response.content;
                    var jobs = [];
                    for(var i in data.jobs) {
                        jobs.push(data.jobs[i].name)
                    }
                    var views = [];
                    for(var i in data.views) {
                        views.push(data.views[i].name)
                    }

                    $("#typeahead-jobs").typeahead({
                        source:jobs,
                        updater:function(item) {
                            jobsalerts(item);
                            $("#typeahead-jobs").val('');
                            return item;
                        }
                    });
                    $("#typeahead-views").typeahead({
                        source:views,
                        updater:function(item) {
                            viewsalerts(item);
                            $("#typeahead-views").val('');
                            return item;
                        }
                    });

                    $("#submit-button").click(function() {
                        console.log("jobs",selectedJobs);
                        console.log("views",selectedViews);
                        var joblist = [];
                        var viewlist = [];
                        for (var job in selectedJobs) {
                            if (selectedJobs[job]) {
                                joblist.push(job);
                            }
                        }
                        for (var view in selectedViews) {
                            if (selectedViews[view]) {
                                viewlist.push(view);
                            }
                        }
                        $.extend(newConfig, {jobs:joblist, views:viewlist});
                        jive.tile.close(newConfig, {});
                    });

                    $("#loading-panel").fadeOut();
                    $("#jobs-panel").show();

                    gadgets.window.adjustHeight();

                });
        }

        getJobs();
    });
});
