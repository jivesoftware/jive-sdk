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
    db = jive.service.persistence(),
    shared = require("../../../services/{{{TILE_PREFIX}}}todoConfig/shared.js");


function processTileInstance(instance) {
    if ( instance['name'] !== '{{{TILE_NAME}}}') {
        return;
    }

    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);
    shared.getClientIDForInstanceConfig(instance).then(function(clientid) {

        var dataToPush = {
            data: {
                "title": "Open Todos",
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
        if(clientid) {
            criteria.clientid = clientid;
        }

        db.find("todos", criteria).then(function( todos ) {
            var todo, i;

            for( i = 0 ; i < todos.length && i < 10; i++) {
                todo = todos[i];
                var todoDesc = {
                    text: todo.name,
                    action: {
                        // Create a url that is a deep link into the the "todo" app, "todoDetail" view.
                        "url": "/apps/{{{TILE_BASE_NAME}}}_{{{GENERATED_UUID}}}/todoDetail/" + encodeURIComponent(JSON.stringify({"id": todo.id})),
                        "relativeUrl": "true"
                    }
                };
                dataToPush.data.contents.push(todoDesc);
            }

            jive.tiles.pushData(instance, dataToPush);
        });
    });
}


var tileUpdate = function() {
    jive.tiles.findByDefinitionName('todo').then(function (instances) {
        if (instances) {
            instances.forEach(function (instance) {
                processTileInstance(instance);
            });
        }
    });
};

exports.eventHandlers = [
    {
        'event' : jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : processTileInstance
    },

    {
        'event' : jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : processTileInstance
    }
];

jive.events.addListener('todoUpdate', tileUpdate);
