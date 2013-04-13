var bootstrap = require('./bootstrap');
var tileConfigurator = require('./tileConfigurator');

exports.all = function( app, rootDir ) {
    bootstrap.start( app, rootDir );
};

exports.one = function( app, tileDir ) {
    tileConfigurator.configureOneTileDir( app, tileDir );
};