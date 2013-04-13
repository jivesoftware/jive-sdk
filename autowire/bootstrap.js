var express = require('express')
    , fs = require('fs')
    , http = require('http')
    , path = require('path')
    , jive = require('../api')
    , tileConfigurator = require('./tileConfigurator')
    , appConfigurator = require('./appConfigurator')
    , consolidate = require('consolidate')
;

exports.start = function( app, rootDir ) {

    var begin = function () {
        // read configuration
        fs.readFile(rootDir + '/jiveclientconfiguration.json', 'utf8', function (err, data) {
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
            app.set('views', rootDir + '/public/tiles');
            app.use(express.favicon());
            app.use(express.static(path.join(rootDir, 'public')));

            app.set('port', data.port || 8070);
            app.set('publicDir', rootDir + '/public');
            app.set('rootDir', rootDir);
        });

        app.emit('event:initialConfigurationComplete', app);
    };

///////////////////////////////////////////////////////////////////////////////////////////////////
// Setup the event handlers

app.on('event:configurationReady', configureApp);
app.on('event:initialConfigurationComplete', function() {
    tileConfigurator.configureTilesDir(app, rootDir + "/tiles" );
});
app.on('event:tileConfigurationComplete', appConfigurator.configureApplication);

///////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////
begin();
///////////////////////////////////////////////////////////////////////////////////////////////////

};
