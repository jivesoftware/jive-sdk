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

/**
 * Library of common methods for manipulating definitions (tiles and extstreams).
 * @module abstractDefinitions
 * @abstract
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var q = require('q');
var jive = require('../../api');

var processFound = function(found, expectOne ) {
    if ( !expectOne ) {
        return found;
    }

    if ( found == null || found.length < 1 ) {
        return null;
    } else {
        // return first one
        return found[0];
    }
};

exports.persistence = function() {
    return jive.context.persistence;
};

/**
 * Save a definition to persistence. If the object does not have an id attribute, a random String is assigned.
 * If the object is already present in persistence, it will be updated; otherwise it will be inserted.
 * On success, the returned promise will be resolved with the inserted or updated object; if failure,
 * the promise will be rejected with an error.
 * @param {Object} definition
 * @returns {Promise} Promise
 */
exports.save = function (definition) {
    var self = this;

    var definitionName = definition['name'];

    // assign a unique id if one doesn't already exist
    if (!definition.id) {
        definition.id = jive.util.guid();
    }

    return self.findByTileName( definitionName).then ( function(found ){
        if ( found ) {
            // an existing tile was found
            jive.logger.info("Updating definition", definitionName );

            definition['id'] = found['id'];
        } else {
            jive.logger.info("Saving new definition", definitionName );
        }

        return self.persistence().save( self.getCollection(), definition['id'], definition );
    });
};

/**
 * @private
 */
exports.filterResults = function( results ) {
    return results;
};

/**
 * @private
 */
exports.getCollection = function() {
    throw 'Must be subclassed';
};

/**
 * Find definitions in persistence using the provided key-value criteria map. For example:
 * <pre>
 *  {
 *      'name': 'samplelist'
 *  }
 * </pre>
 * <br>
 * On success, the returned promise will be resolved with an array of the located objects (which may be
 * empty if none is found matching the criteria). If failure,
 * the promise will be rejected with an error.
 * @param {Object} criteria
 * @param {Boolean} expectOne If true, the promise will be resolved with at most 1 found item, or null (if none are found).
 * @returns {Promise} Promise
 */
exports.find = function ( criteria, expectOne ) {
    var self = this;
    return this.persistence().find( self.getCollection(), criteria ).then( function( found ) {
        found = self.filterResults( found );
        return processFound( found, expectOne );
    } );
};

/**
 * Searches persistence for a definition that matches the given ID (the 'id' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractDefinitions:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} definitionID Id of the definition to be retrieved.
 * @returns {Promise} Promise
 */
exports.findByID = function (definitionID) {
    return this.find( { "id": definitionID }, true );
};

/**
 * Searches persistence for a definition that matches the given name (the 'name' attribute).
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractDefinitions:getCollection}).
 * If one is not found, the promise will resolve a null (undefined) value.
 * @param {String} definitionName Name of the definition to be retrieved.
 * @returns {Promise} Promise
 */
exports.findByTileName = function (definitionName) {
    return this.find( { "name": definitionName }, true );
};

/**
 * Searches persistence for definitions.
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractDefinitions:getCollection}).
 * The promise will resolve with an empty array, or populated array, depending on whether any definitions exist.
 * @returns {Promise} Promise
 */
exports.findAll = function () {
    return this.find( null );
};

/**
 * Removes a definition from persistence with the specified id (attribute 'id').
 * The collection that is searched is defined in subclasses of this class (@see {@link abstractDefinitions:getCollection}).
 * @param {String} definitionID
 * @returns {Promise} Promise
 */
exports.remove = function (definitionID) {
    return this.persistence().remove( this.getCollection(), definitionID );
};

/**
 * Adds a listener to the named definition, for the named event.
 * @param {String} definitionName
 * @param {String} eventName
 * @param {function} handler
 * @param {String} description
 * @returns {Promise} Promise
 */
exports.addEventHandler = function(definitionName, eventName, handler, description) {
    // register event listeners

    jive.events.registerEventListener( event, handler,
        {
            'eventListener' : definitionName,
            'description' : description
        }
    );

    jive.events.registerEventListener(eventName, definitionName, handler, description);
};