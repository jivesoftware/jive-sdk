var http = require('http');
var express = require('express');
var funcster = require('funcster');

exports.instance = BaseServer;

function BaseServer(config) {
    this.config = config;

    if ( !config['port'] ) {
        console.log('No port defined');
        process.exit(-1);
    }
    this.setup();
}

BaseServer.prototype.setup = function() {
    var self = this;

    // listen for interprocess commands
    process.on('message', function(m) {
        var operation = m['operation'];
        if ( operation ) {

            if (operation['pleaseStart'] === true) {
                self.startServer(m.config);
            } else if (operation['pleaseStop'] === true) {
                self.stopServer(m.id);
            } else {
                var response = self.doOperation( m['operation'] );
                process.send({
                    operationSuccess: true,
                    id: m.id,
                    context: response
                });
            }
        }
    });

};

BaseServer.prototype.doOperation = function(operation) {
    var type = operation['type'];
    if (type == "setEndpoint") {
        var method = operation['method'];
        var path = operation['path'];
        var statusCode = operation['statusCode'];
        var body = operation['body'];
        var headers = operation['headers'];
        var handler = operation['handler'];

        this.setEndpoint(method, path, statusCode, body, headers, handler);
        return {}; //operation handled
    }
    else if (type == "setEnv") {
        var env = operation['env'];
        for (var key in env){
            process.env[key] = env[key];
        }
        return {};
    }

    return null;
};

BaseServer.prototype.setEndpoint = function(method, path, statusCode, body, headers, handler) {
    var app = this.app;
//    console.log('Server with config %s called setEndpoint',JSON.stringify(this.config));
//    console.log('method=%s, path=%s, statusCode=%d, headers=%s',method,path,statusCode,JSON.stringify(headers));
    //Default header with json content type

    var hydratedHandler;
    if ( handler ) {

        var self = this;
        hydratedHandler = funcster.deepDeserialize( handler, {
            globals : {
                console : console,
                self : self,
                app  : app
            }
        } );
    }

    if (!headers || headers.length <= 0) {
        headers = {"Content-Type": "application/json"};
    }

    if (method.toUpperCase() == "GET") {
//        delete app.routes.get;
        app.get( path, function( req, res ) {
            if ( hydratedHandler ) {
                if ( !hydratedHandler(req, res, body) ) {
                    res.writeHead(statusCode, headers);
                    res.end(body );
                }
            } else {
                res.writeHead(statusCode, headers);
                res.end(body );
            }
        } );
    }
    if (method.toUpperCase() == "POST") {
//        delete app.routes.post;
        app.post( path, function( req, res ) {
            if ( hydratedHandler ) {
                if ( !hydratedHandler(req, res, body) ) {
                    res.writeHead(statusCode, headers);
                    res.end(body );
                }
            } else {
                res.writeHead(statusCode, headers);
                res.end(body );
            }
        } );
    }
    if (method.toUpperCase() == "PUT") {
//        delete app.routes.put;
        app.put( path, function( req, res ) {
            if ( hydratedHandler ) {
                if ( !hydratedHandler(req, res, body) ) {
                    res.writeHead(statusCode, headers);
                    res.end(body );
                }
            } else {
                res.writeHead(statusCode, headers);
                res.end(body );
            }
        } );
    }
    if (method.toUpperCase() == "DELETE") {
//        delete app.routes.delete;
        app.delete( path, function( req, res ) {
            if ( hydratedHandler ) {
                if ( !hydratedHandler(req, res, body) ) {
                    res.writeHead(statusCode, headers);
                    res.end(body );
                }
            } else {
                res.writeHead(statusCode, headers);
                res.end(body );
            }
        } );
    }
};

BaseServer.prototype.startServer = function() {
    this.app = express();
    var config = this.config;
    var app = this.app;

    function anyBodyParser(req, res, next) {
        var data = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk) {
//            data += chunk;
        });
        req.on('end', function() {
            req.rawBody = data;
            next();
        });
    }

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());

//    app.configure(function() {
//        app.use(anyBodyParser);
//    });

    // start the http server
    this.server = http.createServer(app);
    var serverName = config['serverName'] || '(unnamed)';
    this.server.listen(config.port, function () {
        // when its up, send the signal that its ready to listen
        if ( config.verbos ) {
            console.log("Test server '" + serverName + "' listening on port " + config.port);
        }
        process.send( {serverStarted: true});
    } );
};

BaseServer.prototype.stopServer = function(messageID) {
    var self = this;
    this.server.on('close', function() {
        if ( self.config.verbose ) {
            console.log("Server at port %d with name \"%s\" stopped", self.config.port, self.config.serverName);
        }
        process.send({
            serverStopped: true,
            id: messageID
        });
        process.exit();
    });

    this.server.close();
};