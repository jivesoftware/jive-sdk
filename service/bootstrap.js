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
    consolidate = require('consolidate'),
    q = require('q');

var alreadyBootstrapped = false;

/**
 * Pass in one of the following:
 * - json object representing setup parameters
 *   or
 * - path to the file which contains the setup parameters
 * @param optionsObjectOrFilePath
 * @return {Function|promise|promise|Q.promise}
 */
var loadConfiguration = function (optionsObjectOrFilePath) {
    var deferred = q.defer();

    var checkConfig = function(config) {
        var errors = [];
        if ( !config['clientId'] ) {
            errors.push('Setup parameter clientID is required. Please acquire this from Jive Software.');
        }
        if ( !config['clientSecret'] ) {
            errors.push('Setup parameter clientSecret is required. Please acquire this from Jive Software.');
        }
        if ( !config['clientUrl'] ) {
            errors.push('Setup parameter clientUrl is required');
        }
        return errors;
    };

    if ( typeof optionsObjectOrFilePath === 'object' ) {
        return q.fcall( function() {
            console.log('Startup configuration object');
            console.log(optionsObjectOrFilePath);

            var errors = checkConfig(optionsObjectOrFilePath);
            if ( errors.length > 0 ) {
                throw 'Errors were found in ' +
                    ' in your configuration:\n' + errors + '.';
            }
            return optionsObjectOrFilePath;
        });
    }

    // options must be path
    if ( !optionsObjectOrFilePath ) {
        throw 'Undefined options';
    }

    var configFileToUse = optionsObjectOrFilePath

    fs.readFile(configFileToUse, 'utf8', function (err, data) {
        if (err) throw err;

        console.log('Startup configuration from',configFileToUse);
        console.log(data);

        var jiveConfig = JSON.parse(data);

        var errors = checkConfig(jiveConfig);
        if ( errors.length > 0 ) {
            // clientID and secret must be available at this point!
            throw 'Errors were found in ' +
                ' in your configuration file (' + configFileToUse + '):\n' + errors;
        }

        deferred.resolve(jiveConfig);
    });

    return deferred.promise;
};

var configureApp = function (app, rootDir, config) {
    if ( !app ) {
        return q.fcall(function() {
            console.log("Warning - app not specified.");
        } );
    }

    var p1 = q.defer();
    var p2 = q.defer();

    app.configure(function () {
        app.engine('html', consolidate.mustache);
        app.set('view engine', 'html');
        app.set('views', rootDir + '/public/tiles');
        app.use(express.favicon());
        app.use(express.static(path.join(rootDir, 'public')));

        app.set('publicDir', rootDir + '/public');
        app.set('rootDir', rootDir);
        app.set('port', config['port']);

        console.log('Global framework routes:');
        app.post('/registration', jive.routes.registration);

        console.log("/registration");

        p1.resolve();
    });

    app.configure( 'development', function () {
        console.log('Global dev framework routes:');

        app.get('/tiles', jive.routes.tiles);
        app.get('/tilesInstall', jive.routes.installTiles);
        app.get('/requestCredentials', jive.routes.requestCredentials);

        console.log("/tiles");
        console.log("/tilesInstall");
        console.log("/requestCredentials");

        p2.resolve();
    });

    return q.all( [ p1, p2 ] );
};

/**
 *
 * @param app Required.
 * @param rootDir Optional; defaults to process.cwd() if not specified
 */
exports.start = function( app, optionsObjectOrFilePath, rootDir) {
    if ( alreadyBootstrapped ) {
        return q.fcall( function() {
            console.log('Already bootstrapped, skipping.');
            deferred.resolve();
        });
    }

    console.log("Running bootstrap.");

    // mark already bootstrapped so we don't do it again
    alreadyBootstrapped = true;

    return loadConfiguration(optionsObjectOrFilePath).then( function(config) {
         return configureApp(app, rootDir, config );
     });
};
