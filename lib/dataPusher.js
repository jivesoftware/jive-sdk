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

var refreshTokenFlow = function (instanceLibrary, instance, successCallback, failureCallback) {
    jive.logger.debug("Trying refresh flow for ", instance);
    var clientId = jive.service.options['clientId'];

    instanceLibrary.refreshAccessToken(clientId, instance).then(
        function (updated) {
            if ( !updated['accessToken'] ) {
                // failure
                jive.logger.debug('Failed to refresh access token.');
                failureCallback();
            } else {
                // success
                jive.logger.debug('Successfully refreshed token.');
                instanceLibrary.save(updated).then(successCallback);
            }
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
                jive.logger.debug("Got access invalid access: " + response.statusCode + ".");

                if ( !retryIfFail ) {
                    jive.logger.error('Not executing refresh token flow.');
                    if ( callback ) {
                        callback( response );
                    }
                    return;
                }

                refreshTokenFlow(instanceLibrary, instance,
                    // success
                    function () {
                        jive.logger.debug("Retrying push.");
                        // do not retry on next fail
                        push( pushFunction, type, instance, dataToPush, pushURL, callback, false);
                    },
                    // failure
                    function (result) {
                        jive.logger.warn("RefreshTokenFlow failed.", result || '');
                        if (callback) {
                            callback(response );
                        }
                    }
                );
            } else if ( response.statusCode == 410 ) {
                // push was rejected with a 'gone'
                jive.events.emit("destroyingInstance." + instance['name'], instance);

                // destroy the instance
                if ( instance ) {
                    instanceLibrary.remove(instance['id']).then( function() {
                        jive.events.emit("destroyedInstance." + instance['name'], instance);
                    });
                } else {
                    jive.logger.warn('Instance already gone');
                }


            } else {
                // successful push
                if (callback) {
                    callback(response);
                }
                jive.events.emit(type + "Pushed." + instance['name'], instance, dataToPush, response);
            }
        });
    };

    // lookup the definition
    var definitionName = instance['name'];

    jive.tiles.definitions.findByTileName( definitionName ).then( function(tile) {
        if ( tile ) {
            doPush( jive.tiles );
        } else {
            // must be an extstream
            doPush( jive.extstreams );
        }
    });
};

exports.pushData = function (instance, dataToPush, callback) {
    push(jiveClient.pushData, "data", instance, dataToPush, null, callback, true);
};

exports.pushActivity = function (instance, dataToPush, callback) {
    push(jiveClient.pushActivity, "activity", instance, dataToPush, null, callback, true);
};

exports.pushComment = function(instance, commentURL, dataToPush, callback ) {
    push(jiveClient.pushComment, "comment", instance, dataToPush, commentURL, callback, true);
};
