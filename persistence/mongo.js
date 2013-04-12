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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

/**
 * Reference to the mongo db schema.
 */
var db;

/**
 * Fetches a named collection from the mongo db schema if collection exists; otherwise lazily create the collection.
 * @param collectionID
 * @return {*}
 */
var getCollection = function( collectionID ) {
    var collection = db[collectionID];
    if ( collection ) {
        return collection;
    } else {
        return db.collection(collectionID);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Constructor

/**
 * @param app
 * @constructor
 */
function Mongo(app) {
    var databaseUrl = "mydb";
    if ( app && app.settings && app.settings['databaseUrl'] ) {
        databaseUrl = app.settings['databaseUrl'];
    }
    db = require("mongojs").connect(databaseUrl);
}

module.exports = Mongo;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Save the provided data in a named collection, and invoke the callback
 * when done.
 * @param collectionID
 * @param key
 * @param data
 * @param callback
 */
Mongo.prototype.save = function( collectionID, key, data, callback) {
    var collection = getCollection(collectionID);

    collection.save( data, function(err, saved ) {
        if( err || !saved ) throw err;
        else {
            callback( data );
        }
    } );
};

/**
 * Retrieve a piece of data from a named collection, based on the criteria, and invoke the callback
 * with an array of the results when done.
 * @param collectionID
 * @param criteria
 * @param callback
 */
Mongo.prototype.find = function( collectionID, criteria, callback ) {
    var collection = getCollection(collectionID);
    if (!collection ) {
        callback(null);
        return;
    }

    collection.find(criteria, function(err, items) {
        if( err || !items || items.length < 1) {
            callback([]);
            return;
        }
        callback( items );
    });
};

/**
 * Remove a piece of data from a name collection, based to the provided key, and invoke the callback
 * when done.
 * @param collectionID
 * @param key
 * @param callback
 */
Mongo.prototype.remove = function( collectionID, key, callback ) {
    var collection = getCollection(collectionID);
    if (!collection ) {
        callback();
        return;
    }

    collection.remove({"id": key}, function(err, items) {
        callback();
    });
};
