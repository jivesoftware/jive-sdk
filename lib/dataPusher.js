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

var jiveClient = require('./client');
var jive = require('../api');
var tileRegistry = require('../tile/registry');

var refreshTokenFlow = function (instanceLibrary, instance, successCallback, failureCallback) {
    console.log("Trying refresh flow for ", instance);
    var clientId = jive.config.fetch()['clientId'];

    instanceLibrary.refreshAccessToken(clientId, instance).execute(
        function (updated) {
            // success
            console.log('Successfully refreshed token.');
            instanceLibrary.save(updated).execute(successCallback);
        },

        function (result) {
            // failure
            failureCallback(result);
        }
    );
};

var push = function (pushFunction, type, instance, dataToPush, pushURL, callback, retryIfFail) {
    var doPush = function(instanceLibrary) {

        pushFunction(instance, dataToPush, pushURL ).execute(function (response) {

            if ( !response.statusCode ) {
                // err?
                return;
            }

            if (response.statusCode >= 400 && response.statusCode < 410) {
                console.log("Got access invalid access: " + response.statusCode + ". Trying refresh flow.");

                if ( !retryIfFail ) {
                    console.log('Not executing refresh token flow.');
                    if ( callback ) {
                        callback( response );
                    }
                    return;
                }

                refreshTokenFlow(instanceLibrary, instance,
                    // success
                    function () {
                        console.log("Retrying push.");
                        // do not retry on next fail
                        push( pushFunction, type, instance, dataToPush, pushURL, callback, false);
                    },
                    // failure
                    function (result) {
                        console.log("refreshTokenFlow failed.", result);
                        if (callback) {
                            callback(response);
                        }
                    }
                );
            } else if ( response.statusCode == 410 ) {
                // push was rejected with a 'gone'
                tileRegistry.emit("destroyingInstance." + instance['name'], instance);

                // destroy the instance
                instanceLibrary.remove(instance['id']).execute( function() {
                    tileRegistry.emit("destroyedInstance." + instance['name'], instance);
                });

            } else {
                // successful push
                if (callback) {
                    callback(response);
                }
                tileRegistry.emit(type + "Pushed." + instance['name'], instance, dataToPush, response);
            }
        });
    };

    // lookup the definition
    var definitionName = instance['name'];

    jive.tiles.definitions.findByTileName( definitionName ).execute( function(tile) {
        if ( tile ) {
            doPush( jive.tiles );
        } else {
            // must be an extstream
            doPush( jive.extstreams );
        }
    });
};

exports.pushData = function (instance, dataToPush, callback) {
    push(jiveClient.TileInstance.pushData, "data", instance, dataToPush, null, callback, true);
};

exports.pushActivity = function (instance, dataToPush, callback) {
    push(jiveClient.TileInstance.pushActivity, "activity", instance, dataToPush, null, callback, true);
};

exports.pushComment = function(instance, commentURL, dataToPush, callback ) {
    push(jiveClient.TileInstance.pushComment, "comment", instance, dataToPush, commentURL, callback, true);
};
