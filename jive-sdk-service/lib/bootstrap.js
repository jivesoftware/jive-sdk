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
    path = require('path'),
    service = require('./service'),
    jive = require('../api'),
    consolidate = require('consolidate'),
    q = require('q');

var alreadyBootstrapped = false;

/**
 * @param options
 */
var validateServiceOptions = function (options) {
    // options must be present
    if ( !options ) {
        throw 'Undefined options';
    }

    var errors = [];
    if ( !options['clientUrl'] ) {
        errors.push('Setup parameter clientUrl is required');
    }

    if ( errors.length > 0 ) {
        throw 'Errors were found in ' +
            ' in the configuration:\n' + errors;
    }
};

var setupExpressApp = function (app, rootDir, config) {
    if ( !app ) {
        return q.fcall(function() {
            jive.logger.warn("Warning - app not specified.");
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

        app.set('port', config['port']);

        jive.logger.debug('Global framework routes:');
        app.post('/registration', service.routes.tiles.registration);
        app.post('/unregister', service.routes.tiles.unregister);
        app.post('/jive/oauth/register', service.routes.jive.oauthRegister);

        jive.logger.debug("/registration");
        jive.logger.debug("/unregister");
        jive.logger.debug("/jive/oauth/register");

        // wire in an sdk app with its own views
        var jiveSdkApp = express();

        jiveSdkApp.engine('html js', consolidate.mustache);
        jiveSdkApp.engine('js', consolidate.mustache);
        jiveSdkApp.set('view engine', 'html js');
        jiveSdkApp.set('views', __dirname + '/../views' );    // assume that views will be in the root jive-sdk folder

        app.use( jiveSdkApp );

        // oauth2 endpoints
        jiveSdkApp.get('/javascripts/oauth2client.js', function(req, res) {
            res.render('oauth2client.js');
        });

        p1.resolve();
    });

    app.configure( 'development', function () {
        jive.logger.debug('Global dev framework routes:');

        app.get('/tiles', service.routes.dev.tiles);
        app.get('/tilesInstall', service.routes.dev.installTiles);

        jive.logger.debug("/tiles");
        jive.logger.debug("/tilesInstall");

        p2.resolve();
    });

    return q.all( [ p1, p2 ] );
};

var setupScheduler = function() {
    var deferred = q.defer();

    // add base events
    jive.events.baseEvents.forEach(function(handlerInfo) {
        jive.events.addSystemEventListener(
            handlerInfo['event'],
            handlerInfo['handler'],
            handlerInfo['description']
        );
    });

    service.scheduler().init(jive.events.eventHandlerMap, service.options);
    deferred.resolve();

    return deferred.promise;
};

var setupHttp = function(app, rootDir, options) {
    var deferred = q.defer();

    if ( service.role.isHttp() ) {
        jive.logger.warn('Starting service in HTTP mode');
        setupExpressApp(app, rootDir, options).then( function() {
            jive.logger.info("Http node setup");
            deferred.resolve();
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
};

/**
 * @param app Required.
 * @param rootDir Optional; defaults to process.cwd() if not specified
 */
exports.start = function( app, options, rootDir, tilesDir ) {
    if ( alreadyBootstrapped ) {
        return q.fcall( function() {
            jive.logger.warn('Already bootstrapped, skipping.');
        });
    }

    jive.logger.info("Running bootstrap.");

    // mark this already bootstrapped so we don't do it again
    alreadyBootstrapped = true;

    validateServiceOptions(options);

    return setupScheduler()
        .then( function() { return setupHttp(app, rootDir, options) })
        .then( function() {
            jive.logger.info("Bootstrap complete.");
            jive.logger.info("Started service in ", service.options.role || 'self-contained', "mode");
            jive.events.emit("serviceBootstrapped");
        });
};
