/*jshint laxcomma:true */

var express = require('express')
  , http    = require('http')
  , jive    = require('jive-sdk');

var app = express();

var failServer = function(reason) {
    console.log('FATAL -', reason );
    process.exit(-1);
};

var startServer = function () {
    var server = http.createServer(app).listen( app.get('port') || 8090, function () {
        console.log("Express server listening on port " + server.address().port);
    });
};

jive.service.init(app)
.then( function(app) { return jive.service.autowire(); } )
.then( function() { return jive.service.start(); } ).then( startServer, failServer );
