var jive = require('.'),
    util = require('util'),
    BaseServer = require('./base-server').BaseServer;

util.inherits(IntegrationServer, BaseServer);

exports.IntegrationServer = IntegrationServer;

function IntegrationServer(app, config) {
    IntegrationServer.super_.call(this, app, config);
}

IntegrationServer.prototype.setup = function() {


}

IntegrationServer.prototype.start = function() {
    var configuration = this.config,
        app = this.app,
        self = this;

    var startServer = function() {
        IntegrationServer.super_.prototype.start.call(self);
    }

    var failServer = function(err) {
        jive.logger.error('Error starting test integration server: %s!', JSON.stringify(err));
    }

    console.log('Starting test integration server with config %s', JSON.stringify(configuration));
    jive.service.init(app, configuration)

        .then( function() {
            return jive.service.autowire()
        } )

        .then( function() {
            return jive.service.start()
        } )

        .then(function() {
            self.memory = jive.context.persistence;
            console.log('Initial memory: %s', JSON.stringify(self.memory.getDb()));

        })

        .then( startServer, failServer );




 /*   app.get( '/tiles', jive.routes.tiles );
    app.get( '/tilesInstall', jive.routes.installTiles );*/

}

IntegrationServer.prototype.doOperation = function(operation) {
    var tryBase = IntegrationServer.super_.prototype.doOperation.call(this, operation);
    if (tryBase) {
        return tryBase; //handled
    }

    var type = operation['type'];

    if ( type == "addTask" ) {
        var name = operation['name'] || 'samplelist';
        var tileOrActivity = operation['tileOrActivity'] || 'tile';

        if (tileOrActivity === 'tile') {
            var task = function() {
                jive.tiles.findByDefinitionName( name ).then( function(instances) {
                    instances.forEach( function( instance ) {
                        var dataToPush = {

                        };

                        jive.tiles.pushData( instance, dataToPush).then(
                            function(r) {
                                console.log('Integration server sent pushedData: %s', JSON.stringify(r));
                                process.send( {pushedData: r});
                            }, function(r) {
                                process.send( {pushedData: r});
                            });
                    } );
                });
            };
            var key = jive.tiles.definitions.addTasks( jive.tasks.build( task, 1000 ) );
            return { "task": key };
        } else {
            var task = function() {
                jive.extstreams.findByDefinitionName( name ).then( function(instances) {
                    instances.forEach( function( instance ) {
                        var dataToPush = {

                        };

                        jive.extstreams.pushActivity( instance, dataToPush).then(
                            function(r) {
                                console.log('Integration server sent pushedActivity: %s', JSON.stringify(r));
                                process.send( {pushedActivity: r});
                            }, function(r) {
                                process.send( {pushedActivity: r});
                            });
                    } );
                });
            };

            var key = jive.extstreams.definitions.addTasks( jive.tasks.build( task, 1000 ) );
            return { "task": key };
        }

    } else if ( type == "removeTask" ) {
        var task =  operation['task'];
        jive.tasks.unschedule(task );
        console.log("Removed task", task);
        return {};
    } else if (type == "clearAllTasks") {
        jive.tasks.clearAllTasks();
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