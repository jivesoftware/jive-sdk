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

var push = function (pushFunction, type, instance, dataToPush, pushURL, callback, errCallback, retryIfFail) {
    var doPush = function(instanceLibrary) {

        pushFunction(instance, dataToPush, pushURL ).then(
            // successful push
            function (response) {
                callback(response);
                jive.events.emit(type + "Pushed." + instance['name'], instance, dataToPush, response);
            },

            // error push
            function(response) {

                if (response.statusCode >= 400 && response.statusCode < 410) {
                    jive.logger.debug("Got access invalid access: " + response.statusCode + ".");

                    if ( !retryIfFail ) {
                        jive.logger.error('Not executing refresh token flow.');
                        errCallback( response );
                        return;
                    }

                    refreshTokenFlow(instanceLibrary, instance,
                        // success
                        function (instanceToRetry) {
                            jive.logger.debug("Retrying push.");
                            // do not retry on next fail
                            push( pushFunction, type, instanceToRetry, dataToPush, pushURL, callback, errCallback, false);
                        },

                        // failure
                        function (result) {
                            jive.logger.warn("RefreshTokenFlow failed.", result || '');
                            jive.events.emit("refreshTokenFailed." + instance['name'], instance);
                            errCallback( {statusCode: result.statusCode, error: 'Error refreshing token. Response from Jive ID in body field', body: result } );
                        }
                    );
                } else if ( response.statusCode == 410 ) {
                    // push was rejected with a 'gone'
                    jive.events.emit("destroyingInstance." + instance['name'], instance);

                    // destroy the instance
                    if ( instance ) {
                        instanceLibrary.remove(instance['id']).then( function() {
                            jive.logger.log('Destroying tile instance from database after receiving 410 GONE response', instance);
                            jive.events.emit("destroyedInstance." + instance['name'], instance);
                            errCallback(response);
                        });
                    } else {
                        jive.logger.warn('Instance already gone');
                        errCallback(response);
                    }
                }
                else {
                    errCallback(response); //Another error code
                }
            }

        );
    };

    // lookup the definition
    var definitionName = instance['name'];
    jive.tiles.definitions.findByTileName( definitionName ).then( function(tile) {
        try {
            // its either a tile or an external stream
            doPush( tile ? jive.tiles: jive.extstreams  );
        } catch ( e ) {
            errCallback(e);
        }
    });
};

exports.pushData = function (instance, dataToPush, callback, errCallback) {
    push(jiveClient.pushData, "data", instance, dataToPush, null, callback, errCallback, true);
};

exports.pushActivity = function (instance, dataToPush, callback, errCallback) {
    push(jiveClient.pushActivity, "activity", instance, dataToPush, null, callback, errCallback, true);
};

exports.pushComment = function(instance, commentURL, dataToPush, callback , errCallback) {
    push(jiveClient.pushComment, "comment", instance, dataToPush, commentURL, callback, errCallback, true);
};
