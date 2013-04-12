/**
 * Modify this configuration to match your jive-sdk server's config
 */
var jive = require('../api'),
    express = require('express'),
    routes = require('./testroutes'),
    http = require('http');

var configuration = {
    'port' : 8091,
    'baseUrl' : 'http://charles-z800.jiveland.com',
    'clientId' : '766t8osmgixp87ypdbbvmu637k98fzvc',
    'persistence' : new jive.persistence.mongo()
};

var server;

exports.start = function() {
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

    server = http.createServer(app).listen(configuration.port, function () {
        console.log("Test server listening on port " + configuration.port);
    } );
};

exports.server = function() {
    return server;
}