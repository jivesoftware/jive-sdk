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
var persistence = require('./persistence/dispatcher');
var jive = require('../api');

function Definitions() {
}

module.exports = Definitions;

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

Definitions.prototype.save = function (tileDefinition) {
    var self = this;

    var definitionName = tileDefinition['name'];

    // assign a unique id if one doesn't already exist
    if (!tileDefinition.id) {
        tileDefinition.id = jive.util.guid();
    }

    return self.findByTileName( definitionName).then ( function(found ){
        if ( found ) {
            // an existing tile was found
            console.log("Updating definition", definitionName );

            tileDefinition['id'] = found['id'];
        } else {
            console.log("Saving new definition", definitionName );
        }

        return persistence.save( self.getCollection(), tileDefinition['id'], tileDefinition );
    });
};

Definitions.prototype.filterResults = function( results ) {
    return results;
};

// xxx todo rename to getCollectionID
Definitions.prototype.getCollection = function() {
    throw 'Must be subclassed';
};

Definitions.prototype.find = function ( criteria, expectOne ) {
    var self = this;
    return persistence.find( self.getCollection(), criteria ).then( function( found ) {
        found = self.filterResults( found );
        return processFound( found, expectOne );
    } );
};

Definitions.prototype.findByID = function (tileDefinitionID) {
    return this.find( { "id": tileDefinitionID }, true );
};

Definitions.prototype.findByTileName = function (tilename) {
    return this.find( { "name": tilename }, true );
};

Definitions.prototype.findAll = function () {
    return this.find( null );
};

Definitions.prototype.remove = function (tileDefinitionID) {
    return persistence.remove( this.getCollection(), tileDefinitionID );
};

/**
 * Adds a listener to the named definition, for the named event.
 * // xxx todo - enumerate the events and their callback arguments!
 * @param definitionName
 * @param eventName
 * @param listener
 */
Definitions.prototype.addEventHandler = function(definitionName, eventName, handler, description) {
    // register event listeners
    jive.events.addEventListener(
        eventName, definitionName, handler, description
    );
};

Definitions.prototype.addTasks = function(tasks) {
    // register tasks
    if ( tasks ) {
        if ( tasks['forEach']) {
            tasks.forEach( function( task ) {
                jive.tasks.schedule(task);
            });
        } else {
            jive.tasks.schedule(tasks);
        }
    }
};
