/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    jive = require('../api'),
    consolidate = require('consolidate');

var alreadyBootstrapped = false;

var loadConfiguration = function (app, rootDir) {
    // read configuration from cmd line arguments or from environment

    var configFileFromEnv = process.env['CONFIG_FILE'];
    var configFilePathFromArgs;

    console.log("Command line arguments:");
    process.argv.forEach(function (val, index, array) {
        if ( val.indexOf('=') > -1 ) {
            var arg = val.split(/=/);
            console.log(arg[0],'=',arg[1]);

            if ( arg[0] == 'configFile' ) {
                configFilePathFromArgs = arg[1];
            }
        }
    });

    var configFileToUse =
        configFilePathFromArgs || configFileFromEnv || rootDir + '/jiveclientconfiguration.json';

    fs.readFile(configFileToUse, 'utf8', function (err, data) {
        if (err) throw err;

        console.log('Startup configuration from',configFileToUse);
        console.log(data);

        var jiveConfig = JSON.parse(data);

        if ( jiveConfig.clientId && jiveConfig.clientSecret ) {
            // client id and secret are specified in configuration file
            console.log("Finished client config");
        } else {
            // clientID and secret must be available at this point!
            throw 'ClientID and clientSecret must be configured. Please acquire these from Jive Software, and place it' +
                ' in your configuration file (' + configFileToUse + ').';
        }

        jive.setup.init( jiveConfig );
        app.emit('event:jiveConfigurationReady', jiveConfig);
    });
};

var configureApp = function (app, rootDir, config) {
    app.configure(function () {
        app.engine('html', consolidate.mustache);
        app.set('view engine', 'html');
        app.set('views', rootDir + '/public/tiles');
        app.use(express.favicon());
        app.use(express.static(path.join(rootDir, 'public')));

        app.set('publicDir', rootDir + '/public');
        app.set('rootDir', rootDir);
        app.set('port', config['port']);

        console.log();
        console.log('Configured global framework routes:');
        app.post('/registration', jive.routes.registration);

        console.log("/registration");
        console.log();

    });

    app.configure( 'development', function () {
        console.log();
        console.log('Configured global dev framework routes:');

        app.get('/tiles', jive.routes.tiles);
        app.get('/tilesInstall', jive.routes.installTiles);
        app.get('/requestCredentials', jive.routes.requestCredentials);

        console.log("/tiles");
        console.log("/tilesInstall");
        console.log("/requestCredentials");
        console.log();

    });

    app.emit('event:jiveBoostrapComplete', app);
};

exports.start = function( app, rootDir, bootstrapCompleteCallback ) {

    if ( alreadyBootstrapped ) {
        console.log('Already bootstrapped, or in progress, skipping.');
        bootstrapCompleteCallback();
        return;
    }

    // not yet bootstrapped, proceed
    alreadyBootstrapped = true;

    // setup event listeners
    app.on('event:jiveConfigurationReady', function(config) {
        configureApp(app, rootDir, config);
    });
    app.on('event:jiveBoostrapComplete', bootstrapCompleteCallback );

    loadConfiguration(app, rootDir);
};
