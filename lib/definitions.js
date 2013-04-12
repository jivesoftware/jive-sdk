var persistence = require('../persistence/dispatcher');
var tileRegistry = require('../tile/registry');
var scheduler = require('../tile/simpleScheduler');
var jiveUtil = require('../util');

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
    if (!tileDefinition.id) {
        tileDefinition.id = jiveUtil.guid();
    }

    return {
        execute: function (callback) {
            persistence.save("tileDefinition", tileDefinition.id, tileDefinition, function (saved) {
                callback(saved);
            });
        }
    };
};

Definitions.prototype.find = function ( keyValues, expectOne ) {
        return {
            execute: function (callback) {
                persistence.find("tileDefinition", keyValues, function( found ) {
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
        return Definitions.prototype.find( { "id": tileDefinitionID }, true );
};

Definitions.prototype.findByTileName = function (tilename) {
    return Definitions.prototype.find( { "name": tilename }, true );
};

Definitions.prototype.findAll = function () {
    return Definitions.prototype.find( null );
};

Definitions.prototype.remove = function (tileDefinitionID) {
    return {
        execute: function (callback) {
            persistence.remove("tileDefinition", tileDefinitionID, callback);
        }
    };
};

Definitions.prototype.configure = function( definition, listeners, tasks, callback ) {
    var definitionName = definition['name'];
    if ( !definition['id'] ) {
        definition['id'] = definitionName;
    }

    console.log("Registering", definitionName);

    // save tile definition
    // xxx todo maybe edit??
    Definitions.prototype.save( definition ).execute(
        function(dbTile) {
            console.log("Tile saved:", definitionName );

            var tile = definition['name'];

            // register event listeners
            if ( listeners ) {
                for ( var i in listeners ) {
                    var listenerObj = listeners[i];
                    var event = Object.keys(listenerObj)[0];
                    var listener = listenerObj[event];
                    tileRegistry.addTileListener( event, definitionName, listener );
                }
            }

            // register tasks
            if ( tasks ) {
                for ( var i in tasks ) {
                    var task = tasks[i];
                    var interval = (task.getInterval ? task.getInterval() : undefined ) || 15000;
                    var taskName = (task.getTaskName ? task.getTaskName() : undefined ) || jiveUtil.guid();
                    var key = tile + "." + taskName + ".task";
                    scheduler.schedule(key, interval,
                        typeof task === 'function' ? task : task.getRunnable(),
                        {app: app}
                    );
                }
            }

            if ( callback ) {
                callback( definition );
            }
        }
    );
};
