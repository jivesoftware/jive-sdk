/**
 * Test server that accepts inter-process communication to modify its endpoints.
 */
var express = require('express'),
    routes = require('./testroutes'),
    http = require('http'),
    jive = require('../../jive-sdk'),
    uuid = require('node-uuid'),
    FakeJiveServer = require('./fake-jive-server').FakeJiveServer,
    IntegrationServer = require('./integration-server').IntegrationServer,
    JiveIdServer = require('./jive-id-server').JiveIdServer,
    BaseServer = require('./base-server').BaseServer;

// "Private" variables to this process
var IS_FORKED = typeof process.send !== 'undefined';
var SERVER = null;
var NODE_SERVER = null;

//Setup app
var app = express();
app.use(express.bodyParser());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(app.router);
app.configure('development', function () {
    app.use(express.errorHandler());
});

if (IS_FORKED) {
    process.on('message', function(m) {
    //   console.log("Test server received message from test runner");
    //   console.log(m);

        if (m['pleaseStart'] === true) {
            startServer(m.config);
        }

        if (m['pleaseStop'] === true) {
            stopServer(m.id);
        }

        if ( m['operation'] ) {
            var context = SERVER.doOperation( m['operation'] );
            process.send({
                operationSuccess: true,
                id: m.id,
                context: context
            });
        }
    });
}
else {
    config = {
        'port' : 8096,
        'clientUrl' : 'http://localhost'
    };
    startServer(config);
}

function startServer(configuration) {

    var ServerType = null;

    if (configuration.serverType==='integrationServer') {
        ServerType = IntegrationServer;
    }

    else if (configuration.serverType==='jiveIdServer') {
        ServerType = JiveIdServer;
    }

    else if ( configuration.serverType==='fakeJiveServer') {
        ServerType = FakeJiveServer;
    }
    else if (configuration.serverType==='genericServer') {
        ServerType = BaseServer;
    }
    else {
        console.log('ERROR invalid server type given "%s"', configuration.serverType);
        process.send({serverStarted: false, error: 'Invalid server type given "' + configuration.serverType + '"'});
        process.exit();
    }

    SERVER = new ServerType(app, configuration);

    NODE_SERVER = http.createServer(app);
    NODE_SERVER.listen(configuration.port, function () {
        console.log("Test server '" + configuration['serverName'] + "' listening on port " + configuration.port);
        if (IS_FORKED) {
            process.send( {serverStarted: true});
        }
    } );
}

function stopServer(id) {
    NODE_SERVER.on('close', function() {
        console.log("Server at port " + SERVER.config.port + " stopped");
        process.send({
            serverStopped: true,
            id: id
        });
        process.exit();
    })

    NODE_SERVER.close();

}
