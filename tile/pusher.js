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

var jiveClient = require('./../client');
var jiveApi = require('./../api');
var tileRegistry = require('./registry');

var refreshTokenFlow = function (clientId, instance, successCallback, failureCallback) {
    console.log("Trying refresh flow for ", instance);

    jiveApi.TileInstance.refreshAccessToken(clientId, instance).execute(
        function (updated) {
            // success
            console.log('Successfully refreshed token.');
            jiveApi.TileInstance.save(updated).execute(successCallback);
        },

        function (result) {
            // failure
            failureCallback(result);
        }
    );
};

var push = function (clientId, pushFunction, type, instance, dataToPush, callback, retryIfFail) {
    pushFunction(instance, dataToPush).execute(function (response) {
        console.log(type + ' push to', instance.url, response.statusCode, instance.name);

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

            refreshTokenFlow(clientId, instance,
                // success
                function () {
                    console.log("Retrying push.");
                    // do not retry on next fail
                    push(clientId, pushFunction, type, instance, dataToPush, callback, false);
                },
                // failure
                function (result) {
                    console.log("refreshTokenFlow failed.", result);
                    if (callback) {
                        callback(result);
                    }
                }
            );
        } else if ( response.statusCode == 410 ) {
            // push was rejected with a 'gone'
            tileRegistry.emit("goneInstance." + instance['name'], instance);
        } else {
            // successful push
            tileRegistry.emit("pushedUpdateInstance." + instance['name'], instance, type, dataToPush);
        }
    });
};

exports.pushData = function (clientId, instance, dataToPush, callback) {
    push(clientId, jiveClient.TileInstance.pushData, "data", instance, dataToPush, callback, true);
};

exports.pushActivity = function (clientId, instance, dataToPush, callback) {
    push(clientId, jiveClient.TileInstance.pushActivity, "activity", instance, dataToPush, callback, true);
};