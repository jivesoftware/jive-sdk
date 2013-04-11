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

var db = {};
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

Memory.prototype.save = function( collectionID, key, data, callback) {
    var collection = getCollection(collectionID);
    collection[key] = data;

    callback( data );
};

Memory.prototype.remove = function( collectionID, key, callback ) {
    var collection = getCollection(collectionID );
    delete collection[key];

    callback();
};

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
