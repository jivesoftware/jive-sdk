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

var http                = require('http'),
    persistence         = require('./persistence/dispatcher'),
    jiveClient          = require('./client'),
    tilePusher          = require('./tile/pusher'),
    tileRegistry        = require('./tile/registry'),
    scheduler           = require('./tile/simpleScheduler'),
    jiveUtil            = require('./util')
;

exports.setPersistenceListener = function( listener ) {
    persistence.setListener(listener);
};

var returnOne = function(found, callback ) {
    if ( found == null || found.length < 1 ) {
        callback( null );
    } else {
        // return first one
        callback( found[0] );
    }
};

exports.Application = {

    save: function (application) {

        return {
            execute: function (callback) {
                persistence.save("application", application.clientId, application, function (saved) {
                    callback(saved);
                });
            }
        };
    },

    find: function ( keyValues, expectOne ) {
        return {
            execute: function (callback) {
                persistence.find("application", keyValues, function( found ) {
                    if ( expectOne ) {
                        returnOne( found, callback )
                    } else {
                        callback ( found );
                    }
                } );
            }
        };
    },

    findByAppName: function (appname) {
        return exports.Application.find( { "name": appname }, true );
    },

    findAll: function () {
        return exports.Application.find( null );
    },

    findByID: function (clientId) {
        return exports.Application.find( { "clientId": clientId }, true );
    },

    remove: function (clientId) {
        return {
            execute: function (callback) {
                persistence.remove("application", clientId, callback);
            }
        };
    }

};

exports.TileInstance = {

    save: function (tileInstance) {
        if (!tileInstance.id) {
            tileInstance.id = jiveUtil.guid();
        }

        return {
            execute: function (callback) {
                persistence.save("tileInstance", tileInstance.id, tileInstance, function( saved ) {
                    callback(saved);
                });
            }
        };
    },

    find: function ( keyValues, expectOne ) {
        return {
            execute: function (callback) {
                persistence.find("tileInstance", keyValues, function( found ) {
                    if ( expectOne ) {
                        returnOne( found, callback )
                    } else {
                        callback ( found );
                    }
                } );
            }
        };
    },

    findByID: function (tileInstanceID) {
        return exports.TileInstance.find( { "id" : tileInstanceID }, true );
    },

    findByDefinitionName: function (definitionName) {
        return exports.TileInstance.find( { "name": definitionName } );
    },

    findByScope: function (scope) {
        return exports.TileInstance.find( { "scope" : scope }, true );
    },

    findAll: function () {
        return exports.TileInstance.find( null );
    },

    remove: function (tileInstanceID) {
        return {
            execute: function (callback) {
                persistence.remove("tileInstance", tileInstanceID, callback);
            }
        };
    },

    register: function (client_id, url, config, name, code ) {

        // todo -- validation?

        return {
            execute: function (callback) {
                var options = {
                    client_id: client_id,
                    code: code
                };

                jiveClient.TileInstance.register(options, function (accessTokenResponse) {
                    console.log("Reached Access Token Exchange callback", accessTokenResponse);

                    var tileInstance = {
                        url: url,
                        config: config,
                        name: name
                    };

                    tileInstance['accessToken'] = accessTokenResponse['access_token'];
                    tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
                    tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
                    tileInstance['scope'] = accessTokenResponse['scope'];

                    callback(tileInstance);
                });

            }
        };
    },

    refreshAccessToken: function (client_id, tileInstance) {
        var options = {
            client_id: client_id,
            refresh_token: tileInstance['refreshToken']
        };

        return {
            execute: function (success, failure) {
                jiveClient.TileInstance.refreshAccessToken(options,
                    function (accessTokenResponse) {
                        // success
                        tileInstance['accessToken'] = accessTokenResponse['access_token'];
                        tileInstance['expiresIn'] = accessTokenResponse['expires_in'];
                        tileInstance['refreshToken'] = accessTokenResponse['refresh_token'];
                        success(tileInstance);
                    }, function (result) {
                        // failure
                        console.log('error refreshing access token for ', tileInstance, result);
                        failure(result);
                    }
                );
            }
        }

    },

    pushData: function (client_id, tileInstance, data, callback) {
        tilePusher.pushData(client_id, tileInstance, data, callback);
    },

    pushActivity: function (client_id, tileInstance, activity, callback) {
        tilePusher.pushActivity(client_id, tileInstance, activity, callback);
    },

    pushComment: function (client_id, tileInstance, comment, commentURL, callback) {
        tilePusher.pushComment(client_id, tileInstance, commentURL, comment, callback);
    }

};

exports.TileDefinition = {

    save: function (tileDefinition) {
        if (!tileDefinition.id) {
            tileDefinition.id = jiveUtil.guid();
        }

        return {
            execute: function (callback) {
                persistence.save("tileDefinition", tileDefinition.id, tileDefinition, function (saved) {
                    callback(saved);
                });
            }
        };
    },

    find: function ( keyValues, expectOne ) {
        return {
            execute: function (callback) {
                persistence.find("tileDefinition", keyValues, function( found ) {
                    if ( expectOne ) {
                        returnOne( found, callback )
                    } else {
                        callback ( found );
                    }
                } );
            }
        };
    },

    findByID: function (tileDefinitionID) {
        return exports.TileDefinition.find( { "id": tileDefinitionID }, true );
    },

    findByTileName: function (tilename) {
        return exports.TileDefinition.find( { "name": tilename }, true );
    },

    findAll: function () {
        return exports.TileDefinition.find( null );
    },

    remove: function (tileDefinitionID) {
        return {
            execute: function (callback) {
                persistence.remove("tileDefinition", tileDefinitionID, callback);
            }
        };
    },

    // xxx -- todo - this will get moved and merged maybe with tile/configurator.js
    configure: function( definition, listeners, tasks, callback ) {
        var definitionName = definition['name'];
        if ( !definition['id'] ) {
            definition['id'] = definitionName;
        }

        console.log("Registering", definitionName);

        // save tile definition
        // xxx todo maybe edit??
        exports.TileDefinition.save( definition ).execute(
            function(dbTile) {
                console.log("Tile saved:", definitionName );

                var tile = definition['name'];

                // register event listeners
                if ( listeners ) {
                    for ( var i in listeners ) {
                        var listenerObj = listeners[i];
                        var event = Object.keys(listenerObj)[0];
                        var listener = listenerObj[event];
                        tileRegistry.addTileListener( event, definitionName, listener );
                    }
                }

                // register tasks
                if ( tasks ) {
                    for ( var i in tasks ) {
                        var task = tasks[i];
                        var interval = (task.getInterval ? task.getInterval() : undefined ) || 15000;
                        var taskName = (task.getTaskName ? task.getTaskName() : undefined ) || jiveUtil.guid();
                        var key = tile + "." + taskName + ".task";
                        scheduler.schedule(key, interval,
                            typeof task === 'function' ? task : task.getRunnable(),
                            {app: app}
                        );
                    }
                }

                if ( callback ) {
                    callback( definition );
                }
            }
        );
    }

};

////////////////////////////////////////////////////////////////////
// todo - the new stuff goes here... eventually everything above will migrate!

exports.persistence = {
    'file' : require('./persistence/file'),
    'memory' : require('./persistence/memory'),
    'mongo' : require('./persistence/mongo')
};

exports.config = require('./lib/config');

