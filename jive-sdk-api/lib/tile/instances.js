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

/**
 * Library of common methods for manipulating instances (tiles and extstreams).
 * @module abstractInstances
 * @abstract
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var q = require('q');
var jive = require('../../api');
var jiveClient = require('./../client/jive');

var returnOne = function(found ) {
    if ( found == null || found.length < 1 ) {
        return null;
    } else {
        // return first one
        return found[0];
    }
};

///////////////////////////////////////////////////////////////////////////////////
// public

exports.persistence = function() {
    return jive.context.persistence;
};

exports.getCollection = function() {
    throw 'Must be subclassed';
};

/**
 * Save an instance to persistence. If the object does not have an id attribute, a random String is assigned.
 * If the object is already present in persistence, it will be updated; otherwise it will be inserted.
 * On success, the returned promise will be resolved with the inserted or updated object; if failure,
 * the promise will be rejected with an error.
 * @param {Object} instance
 * @returns {Promise} Promise 
 */
exports.save = function (instance) {
    if (!instance.id) {
        instance.id = jive.util.guid();
    }

    return this.persistence().save(this.getCollection(), instance.id, instance );
};

/**
 * Find instances in persistence using the provided key-value criteria map. For example:
 * <pre>
 *  {
 *      'name': 'samplelist',
 *      'config.number' : 25
 *  }
 * </pre>
 * <br>
 * On success, the returned promise will be resolved with an array of the located objects (which may be
 * empty if none is found matching the criteria). If failure,
 * the promise will be rejected with an error.
 * @param {Object} keyValues
 * @param {Boolean} expectOne If true, the promise will be resolved with at most 1 found item, or null (if none are found).
 * @param {Boolean} cursor If true, the promise will be resolved with a collection cursor object.
 * @returns {Promise} Promise 
 */
exports.find = function ( keyValues, expectOne, cursor ) {
    return this.persistence().find(this.getCollection(), keyValues, cursor).then( function( found ) {
        return expectOne ? returnOne( found ) : found;
    } );
};

/**
 * Searches persistence for an instance that matches the given ID (the 'id' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} instanceID Id of the instance to be retrieved.
 * @returns {Promise} Promise 
 */
exports.findByID = function (instanceID) {
    return this.find( { "id" : instanceID }, true );
};

/**
 * Searches persistence for instances that matches the given definition name (the 'name' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * The promise will resolve with an empty array, or populated array, depending on whether any instances matched the search criteria.
 * @param {String} definitionName
 * @param {Boolean} cursor If true, the promise will be resolved with a collection cursor object.
 * @returns {Promise} Promise 
 */
exports.findByDefinitionName = function (definitionName, cursor) {
    return this.find( { "name": definitionName }, false, cursor );
};

/**
 * Searches persistence for an instance that matches the given scope (the 'scope' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} scope
 * @returns {Promise} Promise 
 */
exports.findByScope = function (scope) {
    return this.find( { "scope" : scope }, true );
};

/**
 * Searches persistence for an instance that matches the given guid (the 'guid' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} guid
 * @returns {Promise} Promise 
 */
exports.findByGuid = function (guid) {
    return this.find( { "guid" : guid }, true );
};

/**
 * Searches persistence for an instance that matches the given push URL (the 'url' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} url
 * @returns {Promise} Promise 
 */
exports.findByURL = function (url) {
    return this.find( { "url" : url }, true );
};

/**
 * Searches persistence for an instance that matches the given community name (the 'community' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} communityName
 * @returns {Promise} Promise 
 */
exports.findByCommunity = function (communityName) {
    return this.find( { "jiveCommunity" : communityName }, true );
};

/**
 * Searches persistence for instances.
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * The promise will resolve with an empty array, or populated array, depending on whether any instances exist.
 * @param {Boolean} cursor If true, the promise will be resolved with a collection cursor object.
 * @returns {Promise} Promise 
 */
exports.findAll = function (cursor) {
    return this.find( null, false, cursor );
};

/**
 * Removes an instance from persistence with the specified id (attribute 'id').
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractInstances:getCollection}).
 * @param {String} instanceID
 * @returns {Promise} Promise 
 */
exports.remove = function (instanceID) {
    return this.persistence().remove(this.getCollection(), instanceID );
};

var findCredentials = function(jiveUrl) {
    var deferred = q.defer();

    if ( jiveUrl) {
        // try to resolve trust by jiveUrl
        jive.community.findByJiveURL( jiveUrl ).then( function(credentials) {
            if( credentials ) {
                deferred.resolve( credentials );
            } else {
                // could not find community trust
                deferred.reject(new Error("Could not find community with jiveUrl " + jiveUrl));
            }
        });
    } else {
        deferred.reject(new Error("Invalid jiveUrl ["+jiveUrl+"]"));
    }

    return deferred.promise;
};

var doRegister = function(options, pushUrl, config, name, jiveUrl, guid, deferred) {
    jiveClient.requestAccessToken(options,
        // success
        function (response) {
            jive.logger.debug("Reached Access Token Exchange callback", response);
            var accessTokenResponse = response['entity'];

            var instance = {
                url: pushUrl,
                config: config,
                name: name
            };

            var scope = accessTokenResponse['scope'];

            instance['accessToken'] = accessTokenResponse['access_token'];
            instance['expiresIn'] = accessTokenResponse['expires_in'];
            instance['refreshToken'] = accessTokenResponse['refresh_token'];
            instance['scope'] = scope;
            instance['guid'] = guid;
            instance['jiveCommunity'] = jiveUrl ?
                jive.community.parseJiveCommunity(jiveUrl)
              : decodeURIComponent(scope.split(/:/)[1].split('/')[0]).split(/:/)[0];

            deferred.resolve( instance );
        },

        // failure
        function(err) {
            jive.logger.error("Failed access token exchange!", err);
            deferred.reject( err );
        }
    );
};

/**
 * Registers a new tile or extstream instance:
 * <ol>
 *     <li>Try to locate a community based on the jiveUrl</li>
 *     <li>If no community is located matching the jiveUrl, the returned promise is rejected with an error.</li>
 *     <li>If a community is located, do an OAuth2 access token exchange with that server using the authorization code ('code') provided.</li>
 *     <li>A tile or extstream instance is created (or updated, if it already exists) using the oauth credentials and register parameters,
 *     and resolved on the returned promise.</li>
 * </ol>
 * @param {String} jiveUrl
 * @param {String} pushUrl
 * @param {Object} config
 * @param {String} name
 * @param {String} code
 * @param {String} guid
 * @returns {Promise} Promise 
 */
exports.register = function (jiveUrl, pushUrl, config, name, code, guid ) {
    var deferred = q.defer();

    return findCredentials(jiveUrl).then( function(credentials) {

        var clientId = credentials['clientId'];
        var clientSecret = credentials['clientSecret'];

        var options = {
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            jiveUrl: jiveUrl
        };

        doRegister(options, pushUrl, config, name, jiveUrl, guid, deferred );

        return deferred.promise;
    }, function(e) {
        deferred.reject(e);
    });
};

function doRefreshAccessToken(options, instance, deferred) {
    jiveClient.refreshAccessToken(options,
        function (response) {
            if (response.statusCode >= 200 && response.statusCode <= 299) {
                var accessTokenResponse = response['entity'];

                // success
                instance['accessToken'] = accessTokenResponse['access_token'];
                instance['expiresIn'] = accessTokenResponse['expires_in'];
                instance['refreshToken'] = accessTokenResponse['refresh_token'];
                deferred.resolve(instance);
            } else {
                jive.logger.error('error refreshing access token for ', instance);
                deferred.reject(response);
            }
        }, function (result) {
            // failure
            jive.logger.error('error refreshing access token for ', instance, result);
            deferred.reject(result);
        }
    );
}

/**
 * Performs an OAuth2 access token refresh with the jive community associated with the passed in instance.
 * If successful, the promise is resolved with the instance object containing the new access token (accessToken). Note
 * that the changes to the instance is not actually saved into persistence at this point.
 * @param {Object} instance Must contain the following fields:
 * @param {String} instance.jiveCommunity Points to an existing community
 * @param {String} instance.refreshToken Refresh token used for acquiring a new access token
 * @returns {Promise} Promise
 */
exports.refreshAccessToken = function (instance) {
    var deferred = q.defer();
    var jiveCommunity = instance['jiveCommunity'];

    // default
    if ( !jiveCommunity ) {
        deferred.reject(new Error("community " + jiveCommunity + " does not exist. Cannot refresh instance access token.") );
    } else {
        jive.community.findByCommunity( jiveCommunity).then( function(community) {
            var options = {};

            if ( community ) {
                options['client_id'] = community['clientId'];
                options['client_secret'] = community['clientSecret'];
                options['jiveUrl'] = community['version' ] == 'post-samurai' ? community['jiveUrl'] : undefined;
            }
            doRefreshAccessToken(options, instance, deferred);
        });
    }

    return deferred.promise;
};

/**
 * Retrieves a map of extended properties set on the instance, in the remote jive community.
 * @param {Object} instance
 * @returns {Promise} Promise 
 */
exports.getExternalProps = function( instance ) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.GET_EXTERNAL_PROPS, {
        'instance' : instance
    } );
};

/**
 * Sets a map of extended properties on the instance, in the remote jive community.
 * @param {Object} instance
 * @param {Object} props
 * @returns {Promise} Promise 
 */
exports.setExternalProps = function( instance, props ) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.SET_EXTERNAL_PROPS, {
        'instance' : instance,
        'props' : props
    } );
};

/**
 * Removes the map of extended properties on the instance, in the remote community.
 * @param {Object} instance
 * @returns {Promise} Promise 
 */
exports.deleteExternalProps = function( instance ){
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.DELETE_EXTERNAL_PROPS, {
        'instance' : instance
    } );
};
