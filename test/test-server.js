/**
 * Modify this configuration to match your jive-sdk server's config
 */
var express = require('express'),
    routes = require('./testroutes'),
    http = require('http'),
    jive = require('../../jive-sdk');

var forkedProcess = true;


var configuration = {
    'port' : 8093,
    'baseUrl' : 'http://localhost',
    'clientId' : '766t8osmgixp87ypdbbvmu637k98fzvc',
    'persistence' : new jive.persistence.memory()
};

jive.config.save( configuration );

var app = express();
app.use(express.bodyParser());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(app.router);
app.configure('development', function () {
    app.use(express.errorHandler());
});

// ROUTES
app.get('/', routes.index);

if (forkedProcess) {
    process.on('message', function(m) {
        console.log("Test server received message from test runner");
        console.log(m);
        if (m['pleaseStart'] == true) {
            startServer();
        }
    });
}
else {
    startServer();
}

function startServer() {
    var server = http.createServer(app).listen(configuration.port, function () {
        console.log("Test server listening on port " + configuration.port);
        if (process.send) {
            process.send( {serverStarted: true});
        }
    } );
}

exports.server = function() {
    return server;
}
