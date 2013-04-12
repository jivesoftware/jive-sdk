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
// Constructor

/**
 * @constructor
 */
function Memory() {
    console.log();
    console.log("******************************");
    console.log("Memory persistence is configured.");
    console.log("Please note that this should");
    console.log("not be used for production!");
    console.log("******************************");
    console.log();
}

Memory.prototype = Object.create({}, {
    constructor: {
        value: Memory,
        enumerable: false
    }
});

module.exports = Memory;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Save the provided data in a named collection, and invoke the callback
 * @param collectionID
 * @param key
 * @param data
 * @param callback
 */
Memory.prototype.save = function( collectionID, key, data, callback) {
    var collection = getCollection(collectionID);
    collection[key] = data;

    callback( data );
};

/**
 * Remove a piece of data from a name collection, based to the provided key, and invoke the callback
 * when done.
 * @param collectionID
 * @param key
 * @param callback
 */
Memory.prototype.remove = function( collectionID, key, callback ) {
    var collection = getCollection(collectionID );
    delete collection[key];

    callback();
};

/**
 * Retrieve a piece of data from a named collection, based on the criteria, and invoke the callback
 * with an array of the results when done.
 * @param collectionID
 * @param keyValues
 * @param callback
 */
Memory.prototype.find = function( collectionID, keyValues, callback ) {
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
                    if ( entryToInspect[ findKey ] !== keyValues[ findKey ] ) {
                        match = false;
                        break;
                    }
                }
            }

            if ( match ) {
                collectionItems.push( collection[colKey] );
            }
        }
    }

    callback( collectionItems );
};
