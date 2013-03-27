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

exports.persistenceListener = function() {
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

    this.save = function( collectionID, key, data, callback) {
        var collection = getCollection(collectionID);
        collection[key] = data;

        callback( data );
    };

    this.findByID = function( collectionID, key, callback ) {
        var collection = getCollection(collectionID);
        var item = null;
        for (var colKey in collection) {
            if (collection.hasOwnProperty(colKey) && colKey === key ) {
                item = collection[colKey];
                break;
            }
        }

        callback(item);
    };

    this.findAll = function( collectionID, callback ) {
        var collection = getCollection(collectionID);
        var collectionItems = [];
        for (var colKey in collection) {
            if (collection.hasOwnProperty(colKey)) {
                collectionItems.push( collection[colKey] );
            }
        }

        callback( collectionItems );
    };

    this.remove = function( collectionID, key, callback ) {
        var collection = getCollection(collectionID );
        delete collection[key];

        callback();
    };
};
