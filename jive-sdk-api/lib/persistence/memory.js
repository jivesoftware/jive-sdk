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

/**
 * New instances of this module will separate state from every other instance.
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

    return {
        /**
         * Save the provided data in a named collection
         * @param collectionID
         * @param key
         * @param data
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
         * @param collectionID
         * @param key
         */
        remove: function( collectionID, key ) {
            return q.fcall( function () {
                var collection = getCollection(collectionID );
                var removed = collection[key];
                delete collection[key];
                return removed;
            });
        },



        /**
         * Retrieve a piece of data from a named collection, based on the criteria, and returns a promise
         * that contains found items when done.
         * @param collectionID
         * @param keyValues
         */
        find: function( collectionID, keyValues ) {
            return q.fcall( function() {

                var collectionItems = [];
                var collection = getCollection(collectionID );
                var findKeys = keyValues ? Object.keys( keyValues ) : undefined;

                for (var colKey in collection) {
                    if (collection.hasOwnProperty(colKey)) {

                        var entryToInspect = collection[colKey];
                        var match = true;
                        if ( findKeys ) {
                            for ( var i in findKeys ) {
                                var findKey = findKeys[i];
                                var keyParts = findKey.split('.');
                                var entryObj = entryToInspect;
                                for ( var k = 0; k < keyParts.length; k++ ) {
                                    var keyPart = keyParts[k];
                                    entryObj = entryObj[keyPart];
                                }

                                var keyValue = keyValues[ findKey ];
                                if ( typeof keyValue == 'object' ) {

                                    if ( keyValue['$gt'] ) {
                                        if ( entryObj <= keyValue['$gt'] ) {
                                            match = false;
                                            break;
                                        }
                                    }

                                    if ( keyValue['$lt'] ) {
                                        if ( entryObj >= keyValue['$lt'] ) {
                                            match = false;
                                            break;
                                        }
                                    }

                                    if ( keyValue['$in'] ) {
                                        if ( keyValue['$in'].indexOf(entryObj) < 0 ) {
                                            match = false;
                                            break;
                                        }
                                    }

                                } else {
                                    if ( entryObj !== keyValue ) {
                                        match = false;
                                        break;
                                    }
                                }
                            }
                        }

                        if ( match ) {
                            collectionItems.push( collection[colKey] );
                        }
                    }
                }

                return collectionItems;
            });
        },

        /**
         * Retrieve a piece of data from a named collection whose key is the one provided.
         * @param collectionID
         * @param key
         */
        findByID: function( collectionID, key ) {
            return q.fcall( function() {
                var collection = getCollection(collectionID );
                return collection[key];
            });
        },

        /**
         * Close it down
         * @return {*}
         */
        close: function() {
            return q.resolve();
        }
    };

};

