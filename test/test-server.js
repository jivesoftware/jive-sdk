/**
 * Modify this configuration to match your jive-sdk server's config
 */
var jive = require('../api'),
    express = require('express'),
    routes = require('./testroutes'),
    http = require('http'),
    jive = require('../../jive-sdk');


var configuration = {
    'port' : 8091,
    'baseUrl' : 'http://charles-z800.jiveland.com',
    'clientId' : '766t8osmgixp87ypdbbvmu637k98fzvc',
    'persistence' : new jive.persistence.mongo()
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

var server = http.createServer(app).listen(configuration.port, function () {
    console.log("Test server listening on port " + configuration.port);
} );


exports.server = function() {
    return server;
}