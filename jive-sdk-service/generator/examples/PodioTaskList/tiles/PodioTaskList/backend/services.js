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

// need to find some better public domain/hosted icons or figure another solution here ...
var colorMap = {
    '2':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_green.png',
    '1':'http://cdn1.iconfinder.com/data/icons/function_icon_set/warning_48.png',
    '0':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_red.png'
}

var refreshToken = "";
var doRefreshToken = false;
function doDataPush(instance) {

    var ticketID = instance['config']['ticketID'];
    var projectID = instance['config']['projectID'] ;

    var tokenStore = jive.service.persistence();
    tokenStore.find('tokens', {'ticket': ticketID }).then(function (found) {
        if (found) {
            var accessToken = found[0]['accessToken']['access_token'];
            refreshToken = found[0]['accessToken']['refresh_token'];

            // only get tasks for the configured project ID ....
            var url;
            if (projectID == 0)
                url = "https://api.podio.com/task/personal/summary?limit=10&oauth_token=" + accessToken
            else
                url = "https://api.podio.com/task/item/" + projectID + "/summary?limit=10&oauth_token=" + accessToken
            jive.util.buildRequest(
                    url,
                    'GET'
                ).then(
                // success
                function (response) {
                    var tasksData = response['entity'];

                    if (tasksData) {
                        var taskCount=0;
                        var listTitle="No tasks assigned";     // default
                        var listTitleSet=false;

                        var taskType = ['overdue', 'today', 'other']  ;
                        var fields=[]; // build up a list of tasks here ...

                        for (var i=0; i<3; i++)   {
                            var taskSet = tasksData[taskType[i]].tasks;
                            taskSet.forEach(function(task) {
                                var taskTitle;
                                var taskUrl;
                                var taskIcon;

                                taskTitle = task.text;
                                if (taskTitle.length >= 40)
                                {
                                    // truncate to fit in tile ..
                                    taskTitle = task.text.substring(0,36);
                                    taskTitle += " ..";

                                }
                                /*
                                 todoAssignee = "** unassigned **" ;
                                 if (todoData[field].assignee  != undefined)
                                 todoAssignee =  todoData[field].assignee.name;
                                 todoDueOn = "** unspecified **";
                                 if (todoData[field].due_on != null)
                                 todoDueOn =  todoData[field].due_on;
                                 */
                                taskUrl = task.link ;

                                taskIcon = colorMap[i]  ;
                                if (!listTitleSet)
                                {
                                    listTitleSet = true;
                                    if (!Number(projectID))
                                        listTitle = task.responsible.name;
                                    else
                                        listTitle = instance['config']['project'] ;
                                }
                                if (taskCount++ < 10)
                                {
                                    // add this task in to the list
                                    fields.push( {
                                        text: '' + taskTitle,
                                        assignee: 'assignee',
                                        due_date: 'due date',
                                        icon: taskIcon,
                                        'linkDescription' : 'Visit this task in Podio' ,
                                        'action' : {
                                            context : {  taskName : task.text, taskUrl : taskUrl, due_date : task.due_date, description : task.description }
                                            }

                                        });
                                }
                            });
                        };

                        var dataToPush={
                            data: {
                                title : " Task(s) for " + listTitle,
                                contents: fields,
                                action :
                                {
                                    text: 'Podio Website' ,
                                    url : 'https://www.podio.com'
                                }
                            }
                        };

                        jive.tiles.pushData(instance, dataToPush).then(function (e) {
                            console.log('* podioTaskList success*');
                        }, function (e) {
                            console.log('* podioTaskList err*');
                        });

                        //console.log(contacts);
                    }
                },

                // fail
                function (response) {
                    console.log("Failed to query! code=" + response.statusCode  + " (" + response.entity.error_description + ")");
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
    10000
);
