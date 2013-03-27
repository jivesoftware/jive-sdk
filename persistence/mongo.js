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

exports.persistenceListener = function(app) {
    var databaseUrl = "mydb";
    if ( app && app.settings && app.settings['databaseUrl'] ) {
        databaseUrl = app.settings['databaseUrl'];
    }
    var db = require("mongojs").connect(databaseUrl);

    var getCollection = function( collectionID ) {
        var collection = db[collectionID];
        if ( collection ) {
            return collection;
        } else {
            return db.collection(collectionID);
        }
    };

    this.save = function( collectionID, key, data, callback) {
        var collection = getCollection(collectionID);
        var toSave = {};
        toSave['id'] = key;
        toSave['data'] = data;

        collection.save( toSave, function(err, saved ) {
            if( err || !saved ) throw err;
            else {
                callback( data );
            }
        } );

        callback( data );
    };

    this.findByID = function( collectionID, key, callback ) {
        var collection = getCollection(collectionID);
        if (!collection ) {
            callback(null);
            return;
        }

        collection.find({"id": key}, function(err, items) {
            if( err || !items || items.length < 1 ) {
                callback(null);
                return;
            }
            callback( items[0]['data'] );
        });
    };

    this.findAll = function( collectionID, callback ) {
        var collection = getCollection(collectionID);
        if (!collection ) {
            callback(null);
            return;
        }
        var toReturn = [];

        collection.find({}, function(err, items) {
            if( err || !items || items.length < 1) {
                callback(toReturn);
            }

            items.forEach( function(item ) {
                toReturn.push(item['data']);
            } );

            callback( toReturn );
        });
    };

    this.remove = function( collectionID, key, callback ) {
        var collection = getCollection(collectionID);
        if (!collection ) {
            callback();
            return;
        }

        collection.remove({"id": key}, function(err, items) {
            callback();
        });
    };
};
