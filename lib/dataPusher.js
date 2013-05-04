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

var doRefreshTokenFlow = function( onSuccess, instanceLibrary, instance, errCallback ) {

    var refreshTokenFlow = function (successCallback, failureCallback) {
        jive.logger.debug("Trying refresh flow for ", instance);

        instanceLibrary.refreshAccessToken(instance).then(
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

    refreshTokenFlow(
        // success
        function (instanceToRetry) {
            jive.logger.debug("Retrying fetch.");
            // do not retry on next fail
            onSuccess(instanceToRetry);
        },

        // failure
        function (result) {
            jive.logger.warn("RefreshTokenFlow failed.", result || '');
            jive.events.emit("refreshTokenFailed." + instance['name'], instance);
            errCallback( {statusCode: result.statusCode, error: 'Error refreshing token. Response from Jive ID in details field', details: result } );
        }
    );
};

var doDestroyInstance = function(instance, instanceLibrary, response, errCallback) {
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
};

var lookupLibrary = function( instance ) {
    var definitionName = instance['name'];
    return jive.tiles.definitions.findByTileName( definitionName ).then( function(tile) {
        return tile ? jive.tiles: jive.extstreams;
    } );
};

/**
 * Analyzes provided response, and does the following:
 * - if 400 - 409, then this is likely a bad access token problem. in this case, perform the s
 *   token flow; if that is successful, perform the successful token refresh callback; otherwise perform the
 *   unsuccessful rrefresh callback.
 * - if 410, then this is caused by the remote instance being permanently deactivated; the integration
 *   should destroy the locally registered instance.
 * - otherwise its unknown error; call the error callback.
 * @param instanceLibrary
 * @param instance
 * @param response
 * @param retryIfFail
 * @param onSuccessfulTokenRefresh
 * @param onUnsuccessfulTokenRefresh
 * @param errCallback
 */
var handleError = function( instanceLibrary, instance, response, retryIfFail,
                            onSuccessfulTokenRefresh, onUnsuccessfulTokenRefresh, errCallback ){

    if (response.statusCode >= 400 && response.statusCode < 410) {
        jive.logger.debug("Got access invalid access: " + response.statusCode + ".");

        if ( !retryIfFail ) {
            jive.logger.error('Not executing refresh token flow.');
            errCallback( response );
        } else {
            doRefreshTokenFlow( function(instanceToRetry) {
                onSuccessfulTokenRefresh(instanceToRetry);
            }, instanceLibrary, instance, onUnsuccessfulTokenRefresh );
        }
    } else if ( response.statusCode == 410 ) {
        doDestroyInstance(instance, instanceLibrary, response, errCallback );
    }
    else {
        errCallback(response); //Another error code
    }
};

var push = function (pushOperation, type, instance, dataToPush, pushURL, callback, errCallback, retryIfFail) {
    lookupLibrary(instance).then( function(instanceLibrary ) {
        pushOperation( instance, dataToPush, pushURL ).then(
            // successful push
            function (response) {
                callback(response);
                jive.events.emit(type + "Pushed." + instance['name'], instance, dataToPush, response);
            },

            // failed push
            function(response) {
                handleError( instanceLibrary, instance, response, retryIfFail,
                    function(instanceToRetry) {
                        // retry push once if refreshtoken was reason for error
                        push( pushOperation, type, instanceToRetry, dataToPush, pushURL, callback, errCallback, false);
                    },
                callback, errCallback );
            }
        );
    } );
};

var fetch = function( fetchOperation, type, instance, fetchURL, callback, errCallback, retryIfFail ) {
    lookupLibrary(instance).then( function(instanceLibrary) {

        fetchOperation( instance, fetchURL ).then(
            // successful fetch
            function(response) {
                callback(response);
            },

            // failed fetch
            function(response) {
                handleError(instanceLibrary, instance, response, retryIfFail,
                    function(instanceToRetry) {
                        // retry fetch once if refreshtoken was reason for error
                        fetch( fetchOperation, type, instanceToRetry, fetchURL, callback, errCallback, false);
                    },
                callback, errCallback );
            }
        );
    } );
};

var remove = function( removeOperation, type, instance, callback, errCallback, retryIfFail ) {
    lookupLibrary(instance).then( function(instanceLibrary) {

        removeOperation( instance ).then(
            // successful fetch
            function(response) {
                callback(response);
            },

            // failed fetch
            function(response) {
                handleError(instanceLibrary, instance, response, retryIfFail,
                    function(instanceToRetry) {
                        // retry fetch once if refreshtoken was reason for error
                        remove( removeOperation, type, instanceToRetry, callback, errCallback, false);
                    },
                callback, errCallback );
            }
        );
    } );
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

exports.fetchExtendedProperties = function( instance, callback, errCallback ) {
    fetch( jiveClient.fetchExtendedProperties, 'extendedProperties', instance, null, callback, errCallback, true );
};

exports.pushExtendedProperties = function (instance, props, callback, errCallback) {
    push(jiveClient.pushExtendedProperties, "extendedProperties", instance, props, null, callback, errCallback, true);
};

exports.removeExtendedProperties = function (instance, callback, errCallback) {
    remove(jiveClient.removeExtendedProperties, "extendedProperties", instance, null, callback, errCallback, true);
};

var getWithTileInstanceAuth = function(instance, url ) {
    var deferred = q.defer();
    fetch( jiveClient.getWithTileInstanceAuth, "instance", instance, url,
        function(instance) {
            deferred.resolve(instance);
        }, function(e) {
            deferred.reject(e);
        },
        true );

    return deferred.promise;
};

exports.getPaginated = function(instance, url) {
    var promise = getWithTileInstanceAuth(instance, url);
    return promise.then(function(entity){
        if (typeof entity !== 'object') {
            return entity;
        }

        if (!entity.links || !entity.links.next) {
            return entity;
        }

        entity.next = function() {
            return exports.getPaginated(instance, entity.links.next);
        };

        return entity;
    });
};