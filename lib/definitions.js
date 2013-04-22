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
    return jive.service.persistence();
};

exports.save = function (tileDefinition) {
    var self = this;

    var definitionName = tileDefinition['name'];

    // assign a unique id if one doesn't already exist
    if (!tileDefinition.id) {
        tileDefinition.id = jive.util.guid();
    }

    return self.findByTileName( definitionName).then ( function(found ){
        if ( found ) {
            // an existing tile was found
            jive.logger.info("Updating definition", definitionName );

            tileDefinition['id'] = found['id'];
        } else {
            jive.logger.info("Saving new definition", definitionName );
        }

        return self.persistence().save( self.getCollection(), tileDefinition['id'], tileDefinition );
    });
};

exports.filterResults = function( results ) {
    return results;
};

// xxx todo rename to getCollectionID
exports.getCollection = function() {
    throw 'Must be subclassed';
};

exports.find = function ( criteria, expectOne ) {
    var self = this;
    return this.persistence().find( self.getCollection(), criteria ).then( function( found ) {
        found = self.filterResults( found );
        return processFound( found, expectOne );
    } );
};

exports.findByID = function (tileDefinitionID) {
    return this.find( { "id": tileDefinitionID }, true );
};

exports.findByTileName = function (tilename) {
    return this.find( { "name": tilename }, true );
};

exports.findAll = function () {
    return this.find( null );
};

exports.remove = function (tileDefinitionID) {
    return this.persistence().remove( this.getCollection(), tileDefinitionID );
};

/**
 * Adds a listener to the named definition, for the named event.
 * // xxx todo - enumerate the events and their callback arguments!
 * @param definitionName
 * @param eventName
 * @param listener
 */
exports.addEventHandler = function(definitionName, eventName, handler, description) {
    // register event listeners
    jive.events.addEventListener(
        eventName, definitionName, handler, description
    );
};

exports.addTasks = function(tasks) {
    // register tasks
    if ( tasks ) {
        if ( tasks['forEach']) {
            var keys = [];
            tasks.forEach( function( task ) {
                keys.push( jive.tasks.schedule(task) );
            });
            return keys;
        } else {
            return jive.tasks.schedule(tasks);
        }
    }
};
