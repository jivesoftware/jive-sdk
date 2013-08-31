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

var q = require('q');
var jive = require('../../api');
//task for a worker
exports.registration = function(context) {
    var guid = context.guid;
    var config = context.config;
    var name = context.name;
    var jiveUrl = context.jiveUrl;
    var pushUrl = context.pushUrl;
    var code = context.code;

    var registerer = function(scope, instanceLibrary) {
        var deferred = q.defer();

        instanceLibrary.findByGuid(guid).then(function (tileInstance) {
            // the instance exists
            // update the config only
            if (tileInstance) {
                // update the config
                tileInstance['config'] = config;

                instanceLibrary.save(tileInstance).then(function () {
                    jive.events.emit("updateInstance", tileInstance);
                    deferred.resolve(tileInstance);
                });

            } else {
                return instanceLibrary.register(jiveUrl, pushUrl, config, name, code, guid).then(
                    function (tileInstance) {
                        if ( !tileInstance ) {
                            var statusObj = { status: 500, 'error': 'Failed to register' };
                            deferred.reject(statusObj);
                            return;
                        }

                        jive.logger.info("registered instance", tileInstance);
                        instanceLibrary.save(tileInstance).then(function () {
                            jive.events.emit("newInstance", tileInstance);
                            var jiveCommunity = tileInstance['jiveCommunity'];
                            if (jiveCommunity) {
                                jive.community.findByCommunity(jiveCommunity).then( function( community ) {
                                    if ( !jiveUrl ) {
                                        // try to derive jiveURL from push URL
                                        jiveUrl = pushUrl.split('/api')[0];
                                    }

                                    community = community || {};
                                    community['jiveUrl'] = jiveUrl;
                                    community['jiveCommunity'] = jiveCommunity;
                                    jive.community.save(community).then(function () {
                                        deferred.resolve(tileInstance);
                                    });
                                });
                            } else {
                                deferred.resolve();
                            }
                        });

                    },
                    function (err) {
                        jive.logger.error('Registration failure for', scope);
                        jive.logger.debug(scope, err);
                        var statusObj = { status: 500, 'error': 'Failed to get acquire access token', 'detail': err };
                        deferred.reject(statusObj);
                    });
            }
        });

        return deferred.promise;
    };

    // try tiles
    var tile;
    var stream;
    return q.all([jive.tiles.definitions.findByTileName(name).then(function(found) {
            tile = found;
        }),
        jive.extstreams.definitions.findByTileName(name).then(function(found) {
            stream = found;
        })
    ]).then(function() {
        if (tile) {
            // register a tile instance
            return registerer(guid, jive.tiles);
        } else if (stream) {
            // register an external stream instance
            return registerer(guid, jive.extstreams);
        } else {
            // its neither tile nor externalstream, so return error
            var statusObj = {
                status: 400,
                message: "No tile or external stream definition was found for the given name '" + name + "'"
            };
            //fail and return statusObj
            return q.reject(statusObj);
        }
    });
};