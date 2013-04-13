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

var fs = require('fs');

module.exports = function() {

    console.log();
    console.log("******************************");
    console.log("File persistence is configured.");
    console.log("Please note that this should");
    console.log("not be used for production!");
    console.log("******************************");
    console.log();

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Private

    var loading = {};
    var cache = {};
    var oldestCacheEntry = null;
    var newestCacheEntry = null;
    var cacheSize = 0;
    var dirtyCount = 0;
    var dirtyCollectionIDs = {};

    //todo: make the target directory configurable
    fs.stat("db", function(err, stat){
        if(err){
            fs.mkdir("db", function(err){
                if(err) throw err;
                setInterval(flushDirty, 15000);
            });
        } else if(stat.isDirectory()){
            setInterval(flushDirty, 15000);
        } else {
            throw "Persistence startup failed: db is not a directory!";
        }
    });
    // flush anything dirty to disk every 15 seconds

    function getFilename(collectionID) {
        return 'db/' + encodeURIComponent(collectionID) + '.json';
    }

    function writeToFS(entry, callback) {
        var json = JSON.stringify(entry.collection, null, 2);
        entry.setDirty(false);
        fs.writeFile(getFilename(entry.collectionID), json, 'UTF-8', callback);
    }

    function readFromFS(collectionID, callback) {
        fs.readFile(getFilename(collectionID), 'UTF-8', function(err, data) {
            callback(err ? {} : JSON.parse(data));
        });
    }

    function flushDirty() {
        var dirty = Object.keys(dirtyCollectionIDs);
        for (var i = 0; i < dirty.length; i++) {
            var collectionID = dirty[i];
            var entry = cache[collectionID];
            writeToFS(entry);
            delete dirtyCollectionIDs[collectionID];
        }
        var shrink = [];
        while (cacheSize > 50) {
            if (cacheSize > 50) {
                shrink.push(oldestCacheEntry.collectionID);
                oldestCacheEntry.discard();
            }
        }
        if (dirty.length) {
            console.log('Updated ' + dirty.length + ' data file(s): [' + (dirty.join(', ')) + ']' )
        }
        if (shrink.length) {
            console.log('Discarded ' + shrink.length + ' data file(s): [' + (shrink.join(', ')) + ']' )
        }
    }

    function getCacheEntry(collectionID, callback) {
        var entry = cache[collectionID];
        if (entry) {
            callback(entry.collection, entry);
        } else if (loading[collectionID]) {
            loading[collectionID].push(callback);
        } else {
            var queue = [ callback ];
            loading[collectionID] = queue;
            readFromFS(collectionID, function(data) {
                delete loading[collectionID];
                var entry = new CacheEntry(collectionID, data);
                entry.add();
                for (var i = 0; i < queue.length; i++) {
                    queue[i](entry.collection, entry);
                }
            });
        }
    }

    function CacheEntry(collectionID, collection) {
        this.collectionID = collectionID;
        this.collection = collection;
        this.when = null; // set only when it is in the linked list
        this.prev = null;
        this.next = null;
        this.dirty = false;
        return this;
    }

    CacheEntry.prototype.setDirty = function(d) {
        if (d) {
            dirtyCollectionIDs[this.collectionID] = true;
        } else {
            delete dirtyCollectionIDs[this.collectionID];
        }
        if (this.dirty != d) {
            dirtyCount += d ? 1 : -1;
        }
        this.dirty = !!d;
    };

    CacheEntry.prototype.add = function() {
        if (this.when) {
            if (newestCacheEntry == this) {
                // already the newest, just bump the date
                this.when = new Date();
                return;
            } else {
                this.discard();
            }
        }
        if (newestCacheEntry) {
            newestCacheEntry.prev = this;
            this.next = newestCacheEntry;
            newestCacheEntry = this;
        } else {
            newestCacheEntry = this;
            oldestCacheEntry = this;
        }
        this.when = new Date();
        cache[this.collectionID] = this;
        cacheSize++;
    };

    CacheEntry.prototype.discard = function() {
        if (this.when) {
            if (oldestCacheEntry == this) {
                oldestCacheEntry = this.prev;
            }
            if (newestCacheEntry == this) {
                newestCacheEntry = this.next;
            }
            if (this.prev) {
                this.prev.next = this.next;
            }
            if (this.next) {
                this.next.prev = this.prev;
            }
            this.prev = null;
            this.next = null;
            this.when = null;
            delete cache[this.collectionID];
            cacheSize--;
        }
    };

    return {
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Public

        save : function( collectionID, key, data, callback) {
            getCacheEntry(collectionID, function(collection, entry) {
                collection[key] = data;
                entry.setDirty(true);
                entry.add(); // set as most recently used
                callback( data );
            });
        },

        remove : function( collectionID, key, callback ) {
            getCacheEntry(collectionID, function(collection, entry) {
                delete collection[key];
                entry.setDirty(true);
                entry.add(); // set as most recently used
                callback();
            });
        },

        find : function( collectionID, keyValues, callback ) {

            getCacheEntry(collectionID, function(collection) {
                var collectionItems = [];
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
            });
        }

    };
};

