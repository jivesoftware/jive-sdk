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


var jive = require("jive-sdk");
var oauth = require('./routes/oauth/sampleOauth');

var refreshToken = "";
var doRefreshToken = false;

function doDataPush(instance) {

    var ticketID = instance['config']['ticketID'];
    var projectID = instance['config'] ['projectID']

    var tokenStore = jive.service.persistence();
    tokenStore.find('tokens', {'ticket': ticketID }).then(function (found) {
        if (found) {
            var accessToken = found[0]['accessToken']['access_token'];
            refreshToken = found[0]['accessToken']['refresh_token'];

            var start_date = new Date();
            start_date.setDate( start_date.getDate());  // current date ...

            var end_date = new Date();
            end_date.setDate( end_date.getDate() + (6*30) ); // ... and end 6 months out ...
            var date_from = String(start_date.getFullYear() + '-' + (start_date.getMonth()+1) + '-' + start_date.getDate())  ;
            var date_to = String(end_date.getFullYear() + '-' + (end_date.getMonth()+1) + '-' + end_date.getDate())  ;

            jive.util.buildRequest(
                    "https://api.podio.com/calendar/?date_from="+date_from+"&date_to="+date_to+"&priority=1&oauth_token=" + accessToken,
                    'GET'
                ).then(
                // success
                function (response) {
                    var calData = response['entity'];

                    if (calData) {
                        var dataToPush={
                            data : {"title" : "Upcoming Events",
                                "events" :[{}] ,
                                "action" : {"text" : "Check out the full calendar" , "url" : "https://podio.com/calendar"}
                            }
                        };
                        var title;
                        var description;
                        var location;
                        var calType = "";       // i.e. Task, Meeting, etc ...
                        var idx = 0;            // indes into dataToPush
                        for (var i=0; i<calData.length; i++)
                        {
                            calType = "Task" ;
                            if (calData[i].app != undefined && calData[i].type != "task")
                            {
                                // don't show projects in the calender, really just want meetings and tasks ...
                               if (calData[i].app.config.name == "Projects")  continue;
                               calType =  calData[i].app.config.item_name;
                            }
                            title = calData[i].title;
                            description =  calType + ": " + calData[i].description;
                            location = calData[i].location;

                            if (title == null) {
                                title = "* title: undefined";
                                calData[i].title = title;
                            }
                            if (description == null) {
                                description = "* description: undefined *";
                                calData[i].description = description;
                            }
                            if (location == null) {
                                location = "* location: undefined *"  ;
                                calData[i].location = location;
                            }
                            if (title.length >= 50)
                            {
                                // truncate to fit in tile ..
                                title = title.substring(0,46);
                                title += " ..";
                            }
                            if (description.length >= 50)
                            {
                                // truncate to fit in tile ..
                                description = description.substring(0,46);
                                description += " ..";
                            }

                            dataToPush.data.events[idx] = {};
                            dataToPush.data.events[idx].title = title;
                            dataToPush.data.events[idx].location = location;
                            dataToPush.data.events[idx].start = calData[i].start_date + "T12:00:00-08:00";
                            dataToPush.data.events[idx].description = description;
                            dataToPush.data.events[idx].action = {text : "Take a closer look ...",
                                            context : {name : calData[i].title, description : calData[i].description,
                                            start_date : calData[i].start_date, location: calData[i].location,
                                            url : calData[i].link}} ;
                            idx++;  // bump index
                        }

                        jive.tiles.pushData(instance, dataToPush).then(function (e) {
                            console.log('* podioCalendar success*');
                        }, function (e) {
                            console.log('* podioCalendar err*');
                        });

                        //console.log(contacts);
                    }
                },

                // fail
                function (response) {
                    console.log("Failed to query!");
                    if (response.statusCode == 401)
                    {
                        // do a token refresh next time around ...
                        doRefreshToken = true;
                    }

                }
            );
        }
    });
}
function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    if (doRefreshToken && refreshToken.length)     {
        console.log( 'refreshing token in {{{TILE_NAME}}} ...')
        oauth.refreshToken( refreshToken, instance['config']['ticketID'] );
        doRefreshToken = false;
    }
    else
        doDataPush(instance);
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    5000
);
