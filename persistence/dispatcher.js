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

var jive = require('../api');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var persistenceListener = null;

/**
 * Interrogates configuration for a persistence strategy; if one is not found,
 * set file persistence by default.
 */
function lazyInit() {
    if ( !persistenceListener ) {
        persistenceListener = jive.config.fetch()['persistence'] || new jive.persistence.file();
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Save data under a key within a named collection, and invoke callback when its done.
 * @param collectionID
 * @param key
 * @param data
 * @param callback
 */
exports.save = function (collectionID, key, data, callback) {
    lazyInit();
    persistenceListener.save(collectionID, key, data, callback);
};

/**
 * Look up a record from within a named collection using key-value pair criteria, and return
 * the resulting array when its done.
 * @param collectionID String
 * @param criteria A JSON key-value structure, eg. { "style": "LIST", "name" : "samplelist" }
 * @param callback Expects a parameter called results eg. function( results ) {..}
 */
exports.find = function (collectionID, criteria, callback) {
    lazyInit();
    persistenceListener.find(collectionID, criteria, callback);
};

/**
 * Remove a record by key from a named collection, and invoke the callback when done.
 * @param collectionID string
 * @param key String
 * @param callback expects no arguments
 */
exports.remove = function (collectionID, key, callback) {
    lazyInit();
    persistenceListener.remove(collectionID, key, callback);
};
