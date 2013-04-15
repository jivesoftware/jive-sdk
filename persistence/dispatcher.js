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
        persistenceListener = jive.setup.options['persistence'] || new jive.persistence.file();
    }
    return persistenceListener;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Save data under a key within a named collection, and return a promise.
 * @param collectionID
 * @param key
 * @param data
 */
exports.save = function (collectionID, key, data) {
    return q.fcall(lazyInit).then( function( persistenceListener) {
        return persistenceListener.save(collectionID, key, data ) }
    );
};

/**
 * Look up a record from within a named collection using key-value pair criteria, and return
 * the a promise that will return the resulting array when its done.
 * @param collectionID String
 * @param criteria A JSON key-value structure, eg. { "style": "LIST", "name" : "samplelist" }
 */
exports.find = function (collectionID, criteria) {
    return q.fcall(lazyInit).then( function( persistenceListener) {
        return persistenceListener.find(collectionID, criteria ) }
    );
};

/**
 * Remove a record by key from a named collection, and return a promise containing removed items when done.
 * @param collectionID string
 * @param key String
 */
exports.remove = function (collectionID, key) {
    return q.fcall(lazyInit).then( function( persistenceListener) {
        return persistenceListener.remove(collectionID, key) }
    );
};
