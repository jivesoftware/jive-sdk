/**
 * Test server that accepts inter-process communication to modify its endpoints.
 */
var express = require('express'),
    http = require('http'),
    jive = require('.'),
    uuid = require('node-uuid'),
    FakeApiGateway = require('./fake-api-gateway').FakeApiGateway,
    IntegrationServer = require('./integration-server').IntegrationServer,
    JiveIdServer = require('./jive-id-server').JiveIdServer,
    BaseServer = require('./base-server').BaseServer;

// "Private" variables to this process
var IS_FORKED = typeof process.send !== 'undefined';
var SERVER = null; //The test server object, e.g. a FakeApiGateway server
var NODE_SERVER = null; //The node server object returned by http.createServer

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
    //Set up listeners to interprocess communication
    process.on('message', function(m) {

        if (m['pleaseStart'] === true) {
            startServer(m.config);
        }

        if (m['pleaseStop'] === true) {
            SERVER.stop(m.id);
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
        'clientUrl' : 'http://localhost',
        'serverType' : 'genericServer',
        'serverName' : 'Generic Test Server started directly'
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

    else if ( configuration.serverType==='fakeApiGateway') {
        ServerType = FakeApiGateway;
    }
    else if (configuration.serverType==='genericServer') {
        ServerType = BaseServer;
    }
    else {
        console.log('ERROR in test-server.js. Invalid server type given "%s"', configuration.serverType);
        process.send({serverStarted: false, error: 'Invalid server type given "' + configuration.serverType + '"'});
        process.exit();
    }

    SERVER = new ServerType(app, configuration);

    SERVER.start();
}


