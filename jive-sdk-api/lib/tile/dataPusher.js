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
var jive = require('../../api');
var q = require('q');

var doRefreshTokenFlow = function( instanceLibrary, instance ) {

    jive.logger.debug("Trying refresh flow for ", instance);

    var deferred = q.defer();

     instanceLibrary.refreshAccessToken(instance).then(
        // success
        function (updated) {
            if ( !updated['accessToken'] ) {
                // failure
                jive.logger.debug('Failed to refresh access token.');
                deferred.reject();
            } else {
                // success
                jive.logger.debug('Successfully refreshed token.');
                instanceLibrary.save(updated).then(function(instanceToRetry) {
                    jive.logger.debug("Retrying fetch.");
                    deferred.resolve(instanceToRetry);
                });
            }
        },

        // failure
        function (result) {
            jive.logger.warn("RefreshTokenFlow failed.", result || '');
            jive.events.emit("refreshTokenFailed." + instance['name'], instance);
            deferred.reject( {statusCode: result.statusCode,
                error: 'Error refreshing token. Response from Jive ID in details field', details: result } );
        }
    );

    return deferred.promise;
};

var doDestroyInstance = function(instance, instanceLibrary, response) {
    var deferred = q.defer();

    // push was rejected with a 'gone'
    jive.events.emit("destroyingInstance." + instance['name'], instance);

    // destroy the instance
    if ( instance ) {
        instanceLibrary.remove(instance['id']).then( function() {
            jive.logger.log('Destroying tile instance from database after receiving 410 GONE response', instance);
            jive.events.emit("destroyedInstance." + instance['name'], instance);
            deferred.resolve(response);
        });
    } else {
        jive.logger.warn('Instance already gone');
        deferred.resolve(response);
    }

    return deferred.promise;
};

/**
 * Analyzes provided response, and does the following:
 * - if 400 - 409, then this is likely a bad access token problem. in this case, perform the s
 *   token flow; if that is successful, perform the successful token refresh callback; otherwise perform the
 *   unsuccessful rrefresh callback.
 * - if 410, then this is caused by the remote instance being permanently deactivated; the integration
 *   should destroy the locally registered instance.
 * - otherwise its unknown error; call the error callback.
 * @param instance
 * @param response
 * @param retryIfFail
 */
var handleError = function( instance, response, retryIfFail ) {

    var tileLookup =  jive.tiles.definitions.findByTileName( instance['name'] ).then( function(tile) {
        return tile;
    } );

    var deferred = q.defer();

    tileLookup.then(

        // successful lookup
        function(tile) {
            // determine library type
            var instanceLibrary = tile ? jive.tiles: jive.extstreams;

            if (response.statusCode == 400) {
                jive.logger.info('Bad request (400) returned pushing data to jive', response);
                deferred.reject(response);
            }
            else if (response.statusCode == 401) {
                jive.logger.info("Unauthorized (401) returned pushing data to Jive", response);

                if ( !retryIfFail ) {
                    jive.logger.error('Not executing refresh flow. Failure on second attempt.', response);
                    deferred.reject( response );
                } else {
                    doRefreshTokenFlow( instanceLibrary, instance ).then(
                        // successful token refresh
                        function(instanceToRetry) {
                            deferred.resolve( instanceToRetry );
                        },

                        // failed token refresh
                        function(err) {
                            deferred.reject( err );
                        }
                    );
                }
            }
            else if ( response.statusCode == 410 ) {
                doDestroyInstance(instance, instanceLibrary, response).then( function(err) {
                    deferred.reject(err);
                } );
            }
            else {
                jive.logger.info('4XX error returned from jive', response);
                deferred.reject(response); //Another error code
            }
        },

        // fail to lookup
        function(err) {
            deferred.reject(err);
        }
    );

    return deferred.promise;
};

var push = function (pushOperation, type, instance, dataToPush, pushURL, retryIfFail) {
    return pushOperation( instance, dataToPush, pushURL ).then(
        // successful push
        function (response) {
            jive.events.emit( type + "Pushed." + instance['name'], instance, dataToPush, response);
            return response;
        },

        // failed push
        function(response) {
            return handleError( instance, response, retryIfFail).then(
                function(instanceToRetry) {
                    // retry push once if refreshtoken was reason for error
                    return push( pushOperation, type, instanceToRetry, dataToPush, pushURL, false);
                },

                function( err ) {
                    return err;
                }
            );
        }
    );
};

var fetch = function( fetchOperation, type, instance, fetchURL, retryIfFail ) {
    return fetchOperation( instance, fetchURL ).then(
        // successful fetch
        function(response) {
            return response;
        },

        // failed fetch
        function(response) {
            handleError( instance, response, retryIfFail).then(
                function(instanceToRetry) {
                    // retry fetch once if refreshtoken was reason for error
                    return fetch( fetchOperation, type, instanceToRetry, fetchURL, false);
                },

                function( err ) {
                    return err;
                }
            );
        }
    );
};

var remove = function( removeOperation, type, instance, retryIfFail ) {
    removeOperation( instance ).then(
        // successful fetch
        function(response) {
            return response;
        },

        // failed fetch
        function(response) {
            return handleError(instance, response, retryIfFail).then(
                function(instanceToRetry) {
                    // retry fetch once if refreshtoken was reason for error
                    remove( removeOperation, type, instanceToRetry, false);
                },

                function( err ) {
                    return err;
                }
            );
        }
    );
};

exports.pushData = function (instance, dataToPush) {
    return push(jiveClient.pushData, "data", instance, dataToPush, null, true);
};

exports.pushActivity = function (instance, dataToPush) {
    return push(jiveClient.pushActivity, "activity", instance, dataToPush, null, true);
};

exports.pushComment = function(instance, commentURL, dataToPush) {
    return push(jiveClient.pushComment, "comment", instance, dataToPush, commentURL, true);
};

exports.fetchExtendedProperties = function( instance ) {
    return fetch( jiveClient.fetchExtendedProperties, 'extendedProperties', instance, null, true );
};

exports.pushExtendedProperties = function (instance, props) {
    return push(jiveClient.pushExtendedProperties, "extendedProperties", instance, props, null, true);
};

exports.removeExtendedProperties = function (instance) {
    return remove(jiveClient.removeExtendedProperties, "extendedProperties", instance, null, true);
};

var getWithTileInstanceAuth = function(instance, url ) {
    return fetch( jiveClient.getWithTileInstanceAuth, "instance", instance, url, true);
};

exports.getPaginated = function(instance, url) {
    var promise = getWithTileInstanceAuth(instance, url);
    return promise.then(function(response){
        var entity = response.entity;
        if (typeof entity !== 'object') {
            return response;
        }

        if (!entity.links || !entity.links.next) {
            return response;
        }

        entity.next = function() {
            return jive.context.scheduler.schedule('getPaginatedResults', {
                'extstream' : instance,
                'commentsURL' : entity.links.next
            } );
        };

        return response;
    });
};