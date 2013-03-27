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
    jiveUtil            = require('./util')
;

exports.setPersistenceListener = function( listener ) {
    persistence.setListener(listener);
};

exports.Application = {

    save: function (application) {

        return {
            execute: function (callback) {
                persistence.save("application", application.clientId, application, function (saved) {
                    persistence.save("application_by_name", application.name, application.clientId, function () {
                        callback(saved);
                    })
                });
            }
        };
    },

    findByID: function (clientId) {
        return {
            execute: function (callback) {
                persistence.findByID("application", clientId, callback);
            }
        };
    },

    findByAppName: function (appname) {
        return {
            execute: function (callback) {
                persistence.findByID("application_by_name", appname, function (clientId) {
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
                persistence.findAll("application", callback);
            }
        };
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
                persistence.save("tileInstance", tileInstance.id, tileInstance, callback);
            }
        };
    },

    findByID: function (tileInstanceID) {
        return {
            execute: function (callback) {
                persistence.findByID("tileInstance", tileInstanceID, callback);
            }
        };
    },

    findByDefinitionName: function (definitionName) {
        return {
            execute: function (callback) {
                persistence.findAll("tileInstance", function (all) {
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
                persistence.findAll("tileInstance", callback);
            }
        };
    },

    remove: function (tileInstanceID) {
        return {
            execute: function (callback) {
                persistence.remove("tileInstance", tileInstanceID, callback);
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
            tileDefinition.id = jiveUtil.guid();
        }

        return {
            execute: function (callback) {
                persistence.save("tileDefinition", tileDefinition.id, tileDefinition, function (saved) {
                    persistence.save("tileDefinition_by_name", tileDefinition.name, tileDefinition.id, function () {
                        callback(saved);
                    })
                });
            }
        };
    },

    findByID: function (tileDefinitionID) {
        return {
            execute: function (callback) {
                persistence.findByID("tileDefinition", tileDefinitionID, callback);
            }
        };
    },

    findByTileName: function (tilename) {
        return {
            execute: function (callback) {
                persistence.findByID("tileDefinition_by_name", tilename, function (tileDefinitionID) {
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
                persistence.findAll("tileDefinition", callback);
            }
        };
    },

    remove: function (tileDefinitionID) {
        return {
            execute: function (callback) {
                persistence.remove("tileDefinition", tileDefinitionID, callback);
            }
        };
    }

};
