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

var jive = require("jive-sdk"),
    shared = require("../../../services/{{{TILE_PREFIX}}}todoConfig/shared.js");


function getFormattedData(id, description) {
    return {
        "activity": {
            "action": {
                "name": "posted",
                "description": description
            },
            "actor": {
                "name": "Actor Name",
                "email": "actor@email.com"
            },
            "object": {
                "type": "website",
                // Create a url based on the tile name and canvas view of the app.  This makes the link go into an app:
                "url": "/apps/{{{TILE_NAME_BASE}}}_{{{GENERATED_UUID}}}/todoDetail/"  + encodeURIComponent(JSON.stringify({"id": id})),
                "image": jive.context.config.clientUrl + ":" +  jive.context.config.port + "/checkbox_checked.png",
                "title": description,
                "description": description
            },
            "properties": {
                // This allows the group context to be exposed to the app:
                "relativeUrl": "true",
                // This makes the title like to the url above.
                "showGoToItemAsTitle" :"true"
            },
            "externalID": '' + id + "-" + (new Date())
        }
    };
}

/**
 * NOTE this is not a task like other samples.  It will not be run periodically instead it will be
 * triggered from the changes to the service.
 */
exports.update = function( obj, description ) {
    jive.extstreams.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
        if ( instances ) {
            instances.forEach( function( instance ) {
                shared.getClientIDForInstanceConfig(instance).then(function(clientid) {
                    var config = instance['config'] || {};
                    if ( config.posting === 'off' ) {
                        return;
                    }

                    if( config.project && config.project !== obj.project ) {
                        return;
                    }

                    if (clientid !== obj.clientid ) {
                        return;
                    }


                    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id );

                    jive.extstreams.pushActivity(instance, getFormattedData(obj.id, description));
                });
            });
        }
    });
};

jive.events.addListener('todoUpdate', exports.update);
