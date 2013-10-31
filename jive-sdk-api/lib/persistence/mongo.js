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

module.exports = function(serviceConfig) {
    var databaseUrl;

    // setup database url
    if (serviceConfig ) {
        databaseUrl = serviceConfig['databaseUrl'];
    }

    if ( !databaseUrl ) {
        // failover to default mongodb
        databaseUrl = 'mydb';
    }

    jive.logger.info("******************");
    jive.logger.info("MongoDB configured");
    jive.logger.info("******************");

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Private

    /**
     * Reference to the mongo db schema.
     */
    var db = require('mongojs').connect(databaseUrl);

    /**
     * Collections are created dynamically in mongodb.
     * @param collectionID
     * @return {*}
     */
    var getCollection = function( collectionID ) {
        return db.collection(collectionID);
    };

    return {

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Public

        /**
         * Save the provided data in a named collection, and return promise
         * @param collectionID
         * @param key
         * @param data
         */
        save : function( collectionID, key, data) {
            var deferred = q.defer();

            data['id'] = key;
            var collection = getCollection(collectionID);
            collection.update({'id':key}, data, {'upsert':true}, function(err, saved ) {
                if( err || !saved ) {
                    throw err;
                }
                else {
                    deferred.resolve(data);
                }
            } );

            return deferred.promise;
        },

        /**
         * Retrieve a piece of data from a named collection, based on the criteria, return promise
         * with an array of the results when done.
         * @param collectionID
         * @param criteria
         */
        find : function( collectionID, criteria) {
            var deferred = q.defer();

            var collection = getCollection(collectionID);

            collection.find(criteria, function(err, items) {
                if( err || !items || items.length < 1) {
                    deferred.resolve([]);
                    return;
                }
                deferred.resolve(items);
            });

            return deferred.promise;
        },

        /**
         * Retrieve a piece of data from a named collection whose key is the one provided.
         * @param collectionID
         * @param key
         */
        findByID: function( collectionID, key ) {
            var deferred = q.defer();

            var collection = getCollection(collectionID);
            var criteria = { 'id': key };

            collection.find(criteria, function(err, items) {
                if( err || !items || items.length < 1) {
                    deferred.resolve([]);
                    return;
                }
                deferred.resolve(items);
            });

            return deferred.promise;
        },

        /**
         * Remove a piece of data from a name collection, based to the provided key, return promise
         * containing removed items when done.
         * @param collectionID
         * @param key
         */
        remove : function( collectionID, key ) {
            var deferred = q.defer();

            var collection = getCollection(collectionID);
            if (!collection ) {
                deferred.resolve();
                return;
            }

            collection.remove({"id": key}, function(err, items) {
                deferred.resolve(items);
            });

            return deferred.promise;
        },

        close: function() {
            return q();
        }

    };

};
