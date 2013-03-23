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


//todo: clean up the memory & file persistence. it's a bit confusing here
var util = require('util')
    , events = require('events')
    , memoryPersistence = require('./fspersistence')
//      , memoryPersistence = require('./memorypersistence')
    , http = require('http')
    , jiveClient = require('./client')
    , tilePusher = require('./tilePusher')
    ;

/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

var PersistenceDispatcher = function () {
    events.EventEmitter.call(this);

    function initListener() {
        if (!persistenceListener) {
            // default to in memory persistence if one is not registered already
            exports.Persistence.register(memoryPersistence.persistenceListener);
        }
    }

    this.save = function (collectionID, key, data, callback) {
        initListener();
        this.emit('save', collectionID, key, data, callback);
    };

    this.findByID = function (collectionID, key, callback) {
        initListener();
        this.emit('findByID', collectionID, key, callback);
    };

    this.findAll = function (collectionID, callback) {
        initListener();
        this.emit('findAll', collectionID, callback);
    };

    this.remove = function (collectionID, key, callback) {
        initListener();
        this.emit('remove', collectionID, callback);
    };
};

util.inherits(PersistenceDispatcher, events.EventEmitter);

var persistenceListener = null;
var persistenceDispatcher = new PersistenceDispatcher();
exports.Persistence = {
    register: function (_persistenceListener) {
        persistenceListener = new _persistenceListener();
        persistenceDispatcher.on('save', persistenceListener.save);
        persistenceDispatcher.on('findByID', persistenceListener.findByID);
        persistenceDispatcher.on('findAll', persistenceListener.findAll);
        persistenceDispatcher.on('remove', persistenceListener.remove);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

exports.Application = {

    save: function (application) {

        return {
            execute: function (callback) {
                persistenceDispatcher.save("application", application.clientId, application, function (saved) {
                    persistenceDispatcher.save("application_by_name", application.name, application.clientId, function () {
                        callback(saved);
                    })
                });
            }
        };
    },

    findByID: function (clientId) {
        return {
            execute: function (callback) {
                persistenceDispatcher.findByID("application", clientId, callback);
            }
        };
    },

    findByAppName: function (appname) {
        return {
            execute: function (callback) {
                persistenceDispatcher.findByID("application_by_name", appname, function (clientId) {
                    if (clientId) {
                        exports.Application.findByID(clientId).execute(function (application) {
                            callback(application);
                        })
                    } else {
                        callback(null);
                    }
                });
            }
        };
    },

    findAll: function () {
        return {
            execute: function (callback) {
                persistenceDispatcher.findAll("application", callback);
            }
        };
    },

    remove: function (clientId) {
        return {
            execute: function (callback) {
                persistenceDispatcher.remove("application", clientId, callback);
            }
        };
    }

};

exports.TileInstance = {

    save: function (tileInstance) {
        if (!tileInstance.id) {
            tileInstance.id = guid();
        }

        return {
            execute: function (callback) {
                persistenceDispatcher.save("tileInstance", tileInstance.id, tileInstance, callback);
            }
        };
    },

    findByID: function (tileInstanceID) {
        return {
            execute: function (callback) {
                persistenceDispatcher.findByID("tileInstance", tileInstanceID, callback);
            }
        };
    },

    findByDefinitionName: function (definitionName) {
        return {
            execute: function (callback) {
                persistenceDispatcher.findAll("tileInstance", function (all) {
                    // todo - implement a joining table, like we do for application_by_name
                    var byDefinition = [];
                    all.forEach(function (instance) {
                        if (instance.name === definitionName) {
                            byDefinition.push(instance);
                        }
                    });

                    callback(byDefinition);
                });
            }
        };
    },

    findAll: function () {
        return {
            execute: function (callback) {
                persistenceDispatcher.findAll("tileInstance", callback);
            }
        };
    },

    remove: function (tileInstanceID) {
        return {
            execute: function (callback) {
                persistenceDispatcher.remove("tileInstance", tileInstanceID, callback);
            }
        };
    },

    register: function (client_id, url, config, name, code) {

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
    }

};

exports.TileDefinition = {

    save: function (tileDefinition) {
        if (!tileDefinition.id) {
            tileDefinition.id = guid();
        }

        return {
            execute: function (callback) {
                persistenceDispatcher.save("tileDefinition", tileDefinition.id, tileDefinition, function (saved) {
                    persistenceDispatcher.save("tileDefinition_by_name", tileDefinition.name, tileDefinition.id, function () {
                        callback(saved);
                    })
                });
            }
        };
    },

    findByID: function (tileDefinitionID) {
        return {
            execute: function (callback) {
                persistenceDispatcher.findByID("tileDefinition", tileDefinitionID, callback);
            }
        };
    },

    findByTileName: function (tilename) {
        return {
            execute: function (callback) {
                persistenceDispatcher.findByID("tileDefinition_by_name", tilename, function (tileDefinitionID) {
                    if (tileDefinitionID) {
                        exports.TileDefinition.findByID(tileDefinitionID).execute(function (tileDefinition) {
                            callback(tileDefinition);
                        })
                    } else {
                        callback(null);
                    }
                });
            }
        };
    },

    findAll: function () {
        return {
            execute: function (callback) {
                persistenceDispatcher.findAll("tileDefinition", callback);
            }
        };
    },

    remove: function (tileDefinitionID) {
        return {
            execute: function (callback) {
                persistenceDispatcher.remove("tileDefinition", tileDefinitionID, callback);
            }
        };
    }

};

//////////// private helpers

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
