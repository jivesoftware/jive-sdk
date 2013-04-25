var jive = require('../../jive-sdk'),
    util = require('util'),
    BaseServer = require('./base-server').BaseServer;

util.inherits(IntegrationServer, BaseServer);

exports.IntegrationServer = IntegrationServer;

function IntegrationServer(app, config) {
    IntegrationServer.super_.call(this, app, config);
}

IntegrationServer.prototype.setup = function() {

    var configuration = this.config,
        app = this.app;
    jive.service.options = configuration;
    this.memory = new jive.persistence.memory();
    jive.service.persistence(this.memory);

    app.get( '/configure', function( req, res ) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end( "<script>jive.tile.onOpen(function() { jive.tile.close({'config':'value'});});</script>" );
    } );

    app.post( '/registration', jive.routes.registration );
    app.get( '/tiles', jive.routes.tiles );
    app.get( '/tilesInstall', jive.routes.installTiles );

    var definition = {
        "sampleData": {"title": "Account Details",
            "contents": [
                {
                    "name": "Value",
                    "value": "Initial data"
                }
            ]},
        "config": "/configure",
        "register": "/registration",
        "displayName": "Table Example",
        "name": "sampletable",
        "description": "Table example.",
        "style": "TABLE",
        "icons": {
            "16": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
            "48": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif",
            "128": "http://i.cdn.turner.com/cnn/.e/img/3.0/global/header/hdr-main.gif"
        }
    };

    var self = this;

    jive.tiles.definitions.save(definition).then(function() {
        console.log('Initial memory: %s', JSON.stringify(self.memory.getDb()));
    });

}

IntegrationServer.prototype.doOperation = function(operation) {
    var tryBase = IntegrationServer.super_.prototype.doOperation.call(this, operation);
    if (tryBase) {
        return tryBase; //handled
    }

    var type = operation['type'];

    if ( type == "addTask" ) {
        var task = function() {
            jive.tiles.findByDefinitionName( "sampletable" ).then( function(instances) {
                instances.forEach( function( instance ) {
                    var dataToPush = {
                        "data":
                        {
                            "title": "Account Details",
                            "contents": [
                                {
                                    "name": "Value",
                                    "value": "Updated " + new Date().getTime()
                                }
                            ]
                        }
                    };

                    jive.tiles.pushData( instance, dataToPush).then(
                        function(r) {
                            process.send( {pushedData: r});
                        }, function(r) {
                            process.send( {pushedData: r});
                        });
                } );
            });
        };

        var key = jive.tiles.definitions.addTasks( jive.tasks.build( task, 1000 ) );
        return { "task": key };

    } else if ( type == "removeTask" ) {
        var task =  operation['task'];
        jive.tasks.unschedule(task );
        console.log("Removed task", task);
        return {};
    } else if (type == "clearInstances") {
        var self = this;
        this.memory.clearInstances().then(function() {
            console.log('Cleared instances from memory. DB = %s', JSON.stringify(self.memory.getDb()));
            process.send({'dbCleared': true});
        });
        return {}
    } else if (type == "findTile") {
        var tileId = operation['tileId'];
        jive.tiles.findByID(tileId).then(function(found) {
            //console.log('Integration server found tile %s', JSON.stringify(found));
            process.send({result: found});
        });
        return {};
    }

    return null;

}