/**
 * Modify this configuration to match your jive-sdk server's config
 */
var express = require('express'),
    routes = require('./testroutes'),
    http = require('http'),
    jive = require('../../jive-sdk');

var forkedProcess = true;

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

        if (m['pleaseStop'] == true) {
            stopServer();
        }
    });
}
else {
    startServer();
}

function startServer() {
    var configuration = {
        'port' : 8093,
        'clientUrl' : 'http://localhost',
        'clientId'      : '4mkgdszjkbzfjwgwsjnj0r5q1db9n0fh',
        'clientSecret'  : 'rm93mbrpr8an2eajq439625vzg3xqp.MyvfefMHZlEv4E49WH6AC90cw2U.1.s'
    };

    var server = http.createServer(app).listen(configuration.port, function () {
        console.log("Test server listening on port " + configuration.port);
        if (process.send) {
            process.send( {serverStarted: true});
        }
    } );
}

function stopServer() {
    process.exit();
}

exports.server = function() {
    return server;
};
