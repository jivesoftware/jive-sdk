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

var db;

function Mongo(app) {
    var databaseUrl = "mydb";
    if ( app && app.settings && app.settings['databaseUrl'] ) {
        databaseUrl = app.settings['databaseUrl'];
    }
    db = require("mongojs").connect(databaseUrl);
}

Mongo.prototype = Object.create({}, {
    constructor: {
        value: Mongo,
        enumerable: false
    }
});

module.exports = Mongo;

var getCollection = function( collectionID ) {
    var collection = db[collectionID];
    if ( collection ) {
        return collection;
    } else {
        return db.collection(collectionID);
    }
};

Mongo.prototype.save = function( collectionID, key, data, callback) {
    var collection = getCollection(collectionID);

    collection.save( data, function(err, saved ) {
        if( err || !saved ) throw err;
        else {
            callback( data );
        }
    } );
};

Mongo.prototype.find = function( collectionID, keyValues, callback ) {
    var collection = getCollection(collectionID);
    if (!collection ) {
        callback(null);
        return;
    }

    collection.find(keyValues, function(err, items) {
        if( err || !items || items.length < 1) {
            callback([]);
            return;
        }
        callback( items );
    });
};

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
