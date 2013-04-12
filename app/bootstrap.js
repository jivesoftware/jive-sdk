var express = require('express')
    , fs = require('fs')
    , http = require('http')
    , path = require('path')
    , jive = require('../api')
    , jiveClient = require('../lib/client')
    , tileConfigurator = require('../tile/configurator')
    , appConfigurator = require('../app/configurator')
    , consolidate = require('consolidate')
;

exports.start = function( app, __dirname ) {

    var begin = function () {
        // read configuration
        fs.readFile(__dirname + '/jiveclientconfiguration.json', 'utf8', function (err, data) {
            if (err) throw err;
            console.log(data);

            var jiveClientConfiguration = JSON.parse(data);
            jive.config.save( jiveClientConfiguration );
            app.emit('event:configurationReady', jiveClientConfiguration);
        });
    };

    var configureApp = function (data) {

        app.configure(function () {
            app.engine('html', consolidate.mustache);
            app.set('view engine', 'html');
            app.set('views', __dirname + '/public/tiles');
            app.use(express.favicon());
            app.use(express.static(path.join(__dirname, 'public')));

            app.set('jiveClientConfiguration', data);
            app.set('port', data.port || 8070);
            app.set('jiveClientPath', __dirname + '/jiveClient');
            app.set('publicDir', __dirname + '/public');
            app.set('rootDir', __dirname);
            app.set('jiveClient', jiveClient);
            app.set('jiveApi', jive);
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
begin();
///////////////////////////////////////////////////////////////////////////////////////////////////

};
