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

var jiveClient = require('./../client/jive');
var jive = require('../../api');
var q = require('q');

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// public

exports.pushData = function (instance, dataToPush) {
    return push(pushDataDelegate, "data", { 'instance' : instance, 'dataToPush': dataToPush });
};

exports.pushActivity = function (instance, dataToPush) {
    return push(pushActivityDelegate, "activity", { 'instance' : instance, 'dataToPush': dataToPush });
};

exports.pushComment = function(instance, commentURL, dataToPush) {
    return push(pushCommentDelegate, "comment", { 'instance' : instance, 'dataToPush': dataToPush, 'pushURL' : commentURL});
};

exports.fetchExtendedProperties = function( instance ) {
    return fetch(fetchExtendedPropertiesDelegate, 'extendedProperties', { 'instance' : instance });
};

exports.pushExtendedProperties = function (instance, props) {
    return push(pushExtendedPropertiesDelegate, "extendedProperties", { 'instance' : instance, 'props': props});
};

exports.removeExtendedProperties = function (instance) {
    return remove(removeExtendedPropertiesDelegate, "extendedProperties", { 'instance' : instance });
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
            return exports.getPaginated( instance, entity.links.next );
        };

        return response;
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// private

var oAuthHandler;

var tileLibraryLookup = function(instance) {
    return jive.tiles.definitions.findByTileName( instance['name'] ).then( function(tile) {
        return tile ? jive.tiles: jive.extstreams;
    });
};

var accessTokenRefresher = function(operationContext, oauth) {
    var d = q.defer();
    var instance = operationContext['instance'];
    var jiveCommunity = instance['jiveCommunity'];

    tileLibraryLookup(instance).then( function(instanceLibrary) {

        jive.community.findByCommunity( jiveCommunity).then( function(community) {
            var options = {};
            if ( community ) {
                options['client_id'] = community['clientId'];
                options['client_secret'] = community['clientSecret'];
                options['refresh_token'] = oauth['refreshToken'];
                options['jiveUrl'] = community['jiveUrl'];

                jiveClient.refreshAccessToken(options,
                    function (response) {
                        if (response.statusCode >= 200 && response.statusCode <= 299) {
                            var accessTokenResponse = response['entity'];

                            // success
                            instance['accessToken'] = accessTokenResponse['access_token'];
                            instance['expiresIn'] = accessTokenResponse['expires_in'];
                            instance['refreshToken'] = accessTokenResponse['refresh_token'];

                            var updatedOAuth = {
                                'accessToken' : instance['accessToken'],
                                'refreshToken' : instance['refreshToken']
                            };

                            instanceLibrary.save(instance).then(function() {
                                d.resolve(updatedOAuth);
                            });
                        } else {
                            jive.logger.error('error refreshing access token for ', instance);
                            d.reject(response);
                        }
                    }, function (result) {
                        // failure
                        jive.logger.error('error refreshing access token for ', instance, result);
                        d.reject(result);
                    }
                );
            } else {
                d.reject();
            }
        });

    });


    return d.promise;
};

var getOAuthHandler = function() {
    if ( !oAuthHandler  ) {
        oAuthHandler = jive.util.oauth.buildOAuthHandler(accessTokenRefresher);
    }

    return oAuthHandler;
};

var doDestroyInstance = function(instance, instanceLibrary, response) {
    var deferred = q.defer();

    // push was rejected with a 'gone'
    jive.events.emit("destroyingInstance", instance);

    // destroy the instance
    if ( instance ) {
        instanceLibrary.remove(instance['id']).then( function() {
            jive.logger.info('Destroying tile instance from database after receiving 410 GONE response', instance);
            jive.events.emit("destroyedInstance", instance);
            deferred.resolve(response);
        });
    } else {
        jive.logger.warn('Instance already gone');
        deferred.resolve(response);
    }

    return deferred.promise;
};

var push = function (pushDelegate, type, operationContext) {
    var d = q.defer();
    var instance = operationContext['instance'];
    var dataToPush = operationContext['dataToPush'];
    var oauth = {
        'accessToken' : instance['accessToken'],
        'refreshToken' : instance['refreshToken']
    };

    tileLibraryLookup(instance).then( function(instanceLibrary) {
        getOAuthHandler().doOperation(pushDelegate, operationContext, oauth).then(
            // success
            function(r) {
                jive.events.emit( type + "Pushed", {
                    'theInstance' : instance,
                    'pushedData' : dataToPush,
                    'response' : r
                });
                d.resolve(r);
            },

            // err
            function(error) {
                if ( error.statusCode == 410 ) {
                    doDestroyInstance(instance, instanceLibrary, error).then( function(err) {
                        d.reject(err);
                    } );
                } else {
                    jive.logger.info('4XX error returned from jive', error);
                    d.reject(error); //Another error code
                }

            }
        );
    });

    return d.promise;
};

var fetch = function( fetchDelegate, type, operationContext ) {
    var d = q.defer();
    var instance = operationContext['instance'];

    var oauth = {
        'accessToken' : instance['accessToken'],
        'refreshToken' : instance['refreshToken']
    };

    getOAuthHandler().doOperation(fetchDelegate, operationContext, oauth).then(
        // success
        function(r) {
            d.resolve(r);
        },

        // err
        function(error) {
            d.reject(error); //Another error code
        }
    );

    return d.promise;
};

var remove = function( removeDelegate, type, operationContext ) {
    var d = q.defer();
    var instance = operationContext['instance'];

    var oauth = {
        'accessToken' : instance['accessToken'],
        'refreshToken' : instance['refreshToken']
    };

    getOAuthHandler().doOperation(removeDelegate, operationContext, oauth).then(
        // success
        function(r) {
            d.resolve(r);
        },

        // err
        function(error) {
            d.reject(error); //Another error code
        }
    );

    return d.promise;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// private delagates

var pushDataDelegate = function(operationContext) {
    return jiveClient.pushData(operationContext['instance'], operationContext['dataToPush'], operationContext['pushURL']);
};

var pushActivityDelegate = function(operationContext) {
    return jiveClient.pushActivity(operationContext['instance'], operationContext['dataToPush']);
};

var pushCommentDelegate = function(operationContext) {
    return jiveClient.pushComment(operationContext['instance'], operationContext['dataToPush'], operationContext['pushURL']);
};

var fetchExtendedPropertiesDelegate = function(operationContext) {
    return jiveClient.fetchExtendedProperties(operationContext['instance']);
};

var pushExtendedPropertiesDelegate = function(operationContext) {
    return jiveClient.pushExtendedProperties(operationContext['instance'], operationContext['props']);
};

var removeExtendedPropertiesDelegate = function(operationContext) {
    return jiveClient.removeExtendedProperties(operationContext['instance']);
};

var getWithTileInstanceAuthDelegate = function(operationContext) {
    return jiveClient.getWithTileInstanceAuth(operationContext['instance'], operationContext['url']);
};
var getWithTileInstanceAuth = function(instance, url ) {
    return fetch( getWithTileInstanceAuthDelegate, "instance", { 'instance' : instance, 'url' : url } );
};