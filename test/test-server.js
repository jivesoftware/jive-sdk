/**
 * Test server that accepts inter-process communication to modify its endpoints.
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
      //  console.log("Test server received message from test runner");
      //  console.log(m);

        if (m['pleaseStart'] == true) {
            startServer(m.config);
        }

        if (m['pleaseStop'] == true) {
            stopServer();
        }

        if ( m['operation'] ) {
            doOperation( m['operation'] );
            process.send({
                operationSuccess: true,
                id: m.id
            });
        }
    });
}
else {
    startServer();
}

function startServer(configuration) {


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

/**
 * Sample operation JSON:
 * {
 *     "type" : "setEndpoint",
 *     "method" : "GET",
 *     "path" : "/test",
 *     "statusCode" : 200,
 *     "body" : "<html><body>Test endpoint body</body></html>"
 *     "headers" : { "Content-Type": "application/json" }
 *
 * }
 * @param operation
 */
function doOperation( operation ) {
    var type = operation['type'];
    if (type == "setEndpoint") {
        var method = operation['method'];
        var path = operation['path'];
        var statusCode = operation['statusCode'];
        var body = operation['body'];
        var headers = operation['headers'];

        setEndpoint(method, path, statusCode, body, headers);


    }
}

function setEndpoint(method, path, statusCode, body, headers) {
    //Default header with json content type
    if (!headers || headers.length <= 0) {
        headers = {"Content-Type": "application/json"};
    }
    if (method.toUpperCase() == "GET") {
        app.get( path, function( req, res ) {
            res.writeHead(statusCode, headers);
            res.end(body );
        } );
    }
    if (method.toUpperCase() == "POST") {
        app.post( path, function( req, res ) {
            res.writeHead(statusCode, headers);
            res.end(body );
        } );
    }
    if (method.toUpperCase() == "PUT") {
        app.put( path, function( req, res ) {
            res.writeHead(statusCode, headers);
            res.end(body );
        } );
    }
    if (method.toUpperCase() == "DELETE") {
        app.delete( path, function( req, res ) {
            res.writeHead(statusCode, headers);
            res.end(body );
        } );
    }
}

exports.server = function() {
    return server;
};
