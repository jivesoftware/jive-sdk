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
var basecamp_Helpers = require( "./routes/oauth/basecamp_helpers");
var sampleOauth = require("./routes/oauth/sampleOauth") ;

var colorMap = {
    'green':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_green.png',
    'red':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_red.png',
    'disabled':'http://cdn1.iconfinder.com/data/icons/function_icon_set/warning_48.png'
};

function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    var config = instance.config;
    var todoData;
    var todoTitle;
    var todoAssignee;
    var todoDueOn;
    var projectUrl;
    var todoIcon;
    var todoListName;
    var todoListDescription="";

    var query = "/projects/" + config['projectID']  + "/todolists/" + config['todoListID'] + ".json";

    basecamp_Helpers.queryBasecampV1( config['accountID'], config['ticketID'], sampleOauth, query).then(
        function(response){
            // good return ...
            // save this data before getting the latest project info ...
            todoData = response.entity.todos.remaining;
            todoListName = response.entity.name;
            if (response.entity.description != undefined)
                todoListDescription =    response.entity.description;

            query = "/projects/" + config['projectID'] + ".json";
            basecamp_Helpers.queryBasecampV1( config['accountID'], config['ticketID'], sampleOauth, query).then(
               function(response) {

                   var data = response.entity;

                   var fields = Object.keys(todoData).map( function(field) {

                       if (field > 9) return;

                       todoTitle = todoData[field].content;
                       if (todoData[field].content.length >= 40)
                       {
                           todoTitle = todoData[field].content.substring(0,36);
                           todoTitle += " ..";

                       }
                       todoAssignee = "** unassigned **" ;
                       if (todoData[field].assignee  != undefined)
                            todoAssignee =  todoData[field].assignee.name;
                       todoDueOn = "** unspecified **";
                        if (todoData[field].due_on != null)
                            todoDueOn =  todoData[field].due_on;
                       projectUrl = "https://basecamp.com/" + config['accountID']  + "/projects/" + config['id'] ;

                       todoIcon = todoData[field]['creator']['avatar_url']  ;
                        return {
                            text: '' + todoTitle,
                            assignee: todoAssignee,
                            due_date: todoDueOn,
                            icon: todoIcon,
                            'linkDescription' : 'Visit this To Do item in Basecamp' ,
                            'action' : {
                                //url : jive.service.options['clientUrl'] + 'BaseCamp-ToDoList/action?id=' + new Date().getTime(),
                                context : {title: todoData[field].content, project:data['name'], todoListName: todoListName,
                                           projectDescription:data['description'] ,dueOn:todoDueOn, assignee:todoAssignee ,
                                            url:projectUrl, todoListDescription : todoListDescription, todoID : todoData[field].id,
                                            projectID : config['projectID'], accountID : config['accountID']
                                           }

                            }
                        }

                    } );

                    var dataToPush={
                        data: {
                            title : data['name'] + " To-Dos",
                            contents: fields,
                            action :
                            {
                                text: 'Basecamp' ,
                                url : 'https://www.basecamp.com'
                            }
                        }
                    };

                    //console.log("Prepared data", JSON.stringify(dataToPush));

                    jive.tiles.pushData( instance, dataToPush );

               },
                function(response)
                {
                    // bad return from project info query
                    console.log("bad query from project info query") ;
                }
            );
        },

        function(response)
        {
            // bad return for todo list items query
            console.log( "bad query from todo list items query");
        }
    );
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
