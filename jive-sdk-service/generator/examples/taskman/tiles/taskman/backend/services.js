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
 * This code pushes data to a tile.  It creates a url that is a deep link into the app.
 */

var jive = require("jive-sdk" ),
    db = jive.service.persistence();


function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    var dataToPush = {
        data: {
            "title": "Open Tasks",
            "contents": [

            ],
            "config": {
                "listStyle": "contentList"
            }
        }
    };

    var criteria = {status: "Open"};

    var project = instance.config.project;  // Project can be specified in the configuration.html
    if(project) {
        criteria.project = project;
        dataToPush.data.title += " in project " + project;
    }

    db.find("tasks", criteria).then(function( tasks ) {
        var task, i;

        for( i = 0 ; i < tasks.length && i < 10; i++) {
            task = tasks[i];
            var taskDesc = {
                text: task.name,
                action: {
                    // Create a url that is a deep link into the the "taskman" app, "taskDetail" view.
                    "url": "/apps/taskman/taskDetail/" + encodeURIComponent(JSON.stringify({"id": task.id})),
                    "relativeUrl": "true"
                }
            };
            dataToPush.data.contents.push(taskDesc);
        }

        jive.tiles.pushData(instance, dataToPush);
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( 'tile-app' ).then( function(instances) {
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
