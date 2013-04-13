var bootstrap = require('./bootstrap');
var tileConfigurator = require('./tileConfigurator');

exports.all = function( app, rootDir ) {
    bootstrap.start( app, rootDir );
};

exports.one = function( app, tileDir, callback ) {
    var promise = tileConfigurator.configureOneTileDir( app, tileDir );
    promise.then( callback );
};