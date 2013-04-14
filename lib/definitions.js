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

var persistence = require('../persistence/dispatcher');
var tileRegistry = require('../tile/registry');
var jive = require('../api');

function Definitions() {
}

Definitions.prototype = Object.create({}, {
    constructor: {
        value: Definitions,
        enumerable: false
    }
});

module.exports = Definitions;

var returnOne = function(found, callback ) {
    if ( found == null || found.length < 1 ) {
        callback( null );
    } else {
        // return first one
        callback( found[0] );
    }
};

Definitions.prototype.save = function (tileDefinition) {
    var self = this;

    var definitionName = tileDefinition['name'];

    // assign a unique id if one doesn't already exist
    if (!tileDefinition.id) {
        tileDefinition.id = jive.util.guid();
    }

    return {
        execute: function (callback) {

            // try to find a definition with the same name
            self.findByTileName( definitionName ).execute( function(found) {
                if ( found ) {
                    // an existing tile was found
                    console.log("Updating tile", definitionName );

                    tileDefinition['id'] = found['id'];
                } else {
                    console.log("Saving new tile", definitionName );
                }

                persistence.save( self.getCollection(), tileDefinition['id'], tileDefinition, function (saved) {
                    if ( callback ) callback(saved);
                });

            });
        }
    };
};

Definitions.prototype.filterResults = function( results ) {
    return results;
};

Definitions.prototype.getCollection = function() {
    throw 'Must be subclassed';
};

Definitions.prototype.find = function ( keyValues, expectOne ) {
    var self = this;
    return {
        execute: function (callback) {
            persistence.find( self.getCollection(), keyValues, function( found ) {
                found = self.filterResults( found );
                if ( expectOne ) {
                    returnOne( found, callback )
                } else {
                    callback ( found );
                }
            } );
        }
    };
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
    var self = this;
    return {
        execute: function (callback) {
            persistence.remove( self.getCollection(), tileDefinitionID, callback);
        }
    };
};

/**
 * Adds a listener to the named definition, for the named event.
 * // xxx todo - enumerate the events and their callback arguments!
 * @param definitionName
 * @param eventName
 * @param listener
 */
Definitions.prototype.addEventHandler = function(definitionName, eventName, handler) {
    // register event listeners
    tileRegistry.addEventListener(
        eventName, definitionName, handler
    );
};

Definitions.prototype.addTasks = function(tasks) {
    // register tasks
    if ( tasks ) {
        tasks.forEach( function( task ) {
            jive.tasks.schedule(task);
        });
    }
};
