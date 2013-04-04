
var express = require('express')
    , fs = require('fs')
    , http = require('http')
    , path = require('path')
    , jiveApi = require('../api')
    , jiveClient = require('../client')
    , tileConfigurator = require('../tile/configurator')
    , appConfigurator = require('../app/configurator')
    , persistence = require('../persistence/file')
    , consolidate = require('consolidate')
;

exports.start = function( app, __dirname ) {

    var start = function () {
        // read configuration
        fs.readFile(__dirname + '/jiveclientconfiguration.json', 'utf8', function (err, data) {
            if (err) throw err;
            console.log(data);

            var jiveClientConfiguration = JSON.parse(data);
            app.emit('event:configurationReady', jiveClientConfiguration);
        });
    };

    var configureApp = function (data) {
        // Setup for file based persistence
        jiveApi.setPersistenceListener( new persistence.persistenceListener(app) );

        app.configure(function () {
            app.engine('html', consolidate.mustache);
            app.set('view engine', 'html');
            app.set('views', __dirname + '/public/tiles');
            app.use(express.favicon());
            app.use(express.logger('dev'));
            app.use(express.bodyParser());
            app.use(express.methodOverride());
            app.use(app.router);
            app.use(express.static(path.join(__dirname, 'public')));

            app.set('jiveClientConfiguration', data);
            app.set('port', data.port || 8070);
            app.set('jiveClientPath', __dirname + '/jiveClient');
            app.set('publicDir', __dirname + '/public');
            app.set('rootDir', __dirname);
            app.set('jiveClient', jiveClient);
            app.set('jiveApi', jiveApi);
        });

        app.emit('event:initialConfigurationComplete', app);
    };

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup the event handlers

    app.on('event:configurationReady', configureApp);
    app.on('event:initialConfigurationComplete', tileConfigurator.configureTiles);
    app.on('event:tileConfigurationComplete', appConfigurator.configureApplication);

///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
start();
///////////////////////////////////////////////////////////////////////////////////////////////////

};
