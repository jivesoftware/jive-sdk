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

var q = require('q');
var jive = require('../../api');
var persistenceBase = require('./persistence-base');

/**
 * An in-memory implementation of persistence.
 * @module memoryPersistence
 * @constructor
 */
module.exports = function() {

    jive.logger.warn("******************************");
    jive.logger.warn("Memory persistence is configured.");
    jive.logger.warn("Please note that this should");
    jive.logger.warn("not be used for production!");
    jive.logger.warn("******************************");

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Private

    /**
     * In-memory data structure to use as a database
     * @type {{}}
     */
    var db = {};

    /**
     * Fetches a named collection from the db if collection exists; otherwise lazily create the collection.
     * @param collectionID
     * @return {*}
     */
    var getCollection = function( collectionID ) {
        var collection = db[collectionID];
        if ( collection ) {
            return collection;
        } else {
            collection = {};
            db[collectionID] = collection;
            return collection;
        }
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Public

    /**
     * @inner
     * @type {{save: Function, remove: Function, find: Function, findByID: Function, close: Function}}
     */
    var memoryPersistence = {
        /**
         * Save the provided data in a named collection
         * @memberof memoryPersistence
         * @param {String} collectionID
         * @param {String} key
         * @param {Object} data
         * @returns {Object} promise
         */
        save: function( collectionID, key, data) {
            return q.fcall( function () {
                var collection = getCollection(collectionID);
                collection[key] = data;
                return data;
            });
        },

        /**
         * Remove a piece of data from a name collection, based to the provided key and return a promise
         * that returns removed items when done.
         * @memberof memoryPersistence
         * @param {String} collectionID
         * @param {String} keyValues
         * @returns {Object} promise
         */
        remove: function( collectionID, keyValues ) {
            var that = this;

            return q.fcall( function () {
                var collection = getCollection(collectionID);

                if (typeof keyValues == 'object') {
                    var removedItems = [];

                    persistenceBase.findMatchingKeys(collection, keyValues).forEach(function(key) {
                        var removed = collection[key];
                        removedItems.push(removed);
                        delete collection[key];
                    });

                    return removedItems;
                } else {
                    var removed = collection[keyValues];
                    delete collection[keyValues];
                    return removed;
                }
            });
        },



        /**
         * Retrieve a piece of data from a named collection, based on the criteria, and returns a promise
         * that contains found items when done.
         * @memberof memoryPersistence
         * @param {String} collectionID
         * @param {Object} keyValues
         * @param {Boolean} cursor If true, returns an iterable cursor.
         * @returns {Object} promise
         */
        find: function( collectionID, keyValues, cursor ) {
            var p = q.defer();

                var collectionItems = [];
                var collection = getCollection(collectionID );

                persistenceBase.findMatchingKeys(collection, keyValues).forEach(function(key) {
                    collectionItems.push(collection[key]);
                });

                if ( !cursor ) {
                    p.resolve( collectionItems );
                } else {
                    p.resolve(persistenceBase.createCursor(collectionItems));
                }
            return p.promise;
        },

        /**
         * Retrieve a piece of data from a named collection whose key is the one provided.
         * @memberof memoryPersistence
         * @param collectionID
         * @param key
         * @returns {Object} promise
         */
        findByID: function( collectionID, key ) {
            return q.fcall( function() {
                var collection = getCollection(collectionID );
                return collection[key];
            });
        },

        /**
         * Close it down
         * @memberof memoryPersistence
         * @returns {Object} promise
         */
        close: function() {
            return q.resolve();
        }
    };

    return memoryPersistence;

};

