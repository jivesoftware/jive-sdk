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
var q = require('q');
var maxImages = 4;

function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    function getFormattedData(count) {
        return {
            data: {
                "title": "Simple Gallery",
                "contents": [
                    {
                        "image": jive.context.config.clientUrl + ":" +  jive.context.config.port + "/{{{TILE_NAME}}}/IMG_" + (count % maxImages) + ".jpg",
                        "title": "sample image " + (count % maxImages)
                    }, {
                        "image": jive.context.config.clientUrl + ":" +  jive.context.config.port + "/{{{TILE_NAME}}}/IMG_" + ((count + 1) % maxImages) + ".jpg",
                        "title": "sample image " + ((count + 1) % maxImages)
                    }
                ],
                "config": {
                    "listStyle": "contentList"
                }
            }
        };
    }

    var store = jive.service.persistence();
    return store.find('exampleStore', {
        'key':'count'
    }).then(function(found) {
        found = found.length > 0 ? found[0].count : 0;

        store.save('exampleStore', 'count', {
            'key':'count',
            'count':(found+1) % maxImages
        }).then(function() {
            return jive.tiles.pushData(instance, getFormattedData(found));
        });
    }, function(err) {
        //some error
        jive.logger.debug('Error encountered, push failed', err);
    });
}

var pushData = function() {
    var deferred = q.defer();
    jive.tiles.findByDefinitionName('{{{TILE_NAME}}}').then(function(instances) {
        if (instances) {
            q.all(instances.map(processTileInstance)).then(function() {
                deferred.resolve(); //success
            }, function() {
                deferred.reject(); //failure
            });
        } else {
            jive.logger.debug("No jive instances to push to");
            deferred.resolve();
        }
    });
    return deferred.promise;
};

exports.task = [
    {
        'event' : 'pushDataTileInstance',
        'interval' : 30000
    }
];

exports.eventHandlers = [
    {
        'event' : 'pushDataTileInstance',
        'handler' : pushData
    },

    {
        'event' : 'newInstance',
        'handler' : processTileInstance
    },

    {
        'event' :'updateInstance',
        'handler' : pushData

    }
];
