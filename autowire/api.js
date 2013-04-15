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

/**
 * This is the entry point into the autowire api, which uses the underlying SDK api
 * to automagically configure your definitions by either (1) providing a base directory
 * of your tiles, or (2) configure just one definition by its directory.
 */

var q = require('q');
var bootstrap = require('./bootstrap');
var tileConfigurator = require('./tileConfigurator');

/**
 * Autowire all the tile directories found under the provided tile root directory.
 * @param app
 * @param rootDir
 */
exports.all = function( app, rootDir ) {
    var deferred = q.defer();

    bootstrap.start( app, rootDir, function() {
        // when bootstrapping is done
        tileConfigurator.configureDefinitionsDir( app, rootDir + '/tiles', function() {
            // once tile configuration is done, emit the all done signal
            deferred.resolve();
            app.emit('event:jiveConfigurationComplete');
        } );
    } );

    return deferred.promise;
};

/**
 * Autowire a single definition via its directory. The expected structure under that directory looks like
 * this:
 * tileDir/
 *   /serivces
 *   /routes
 *      /route1example
 *         get.js
 *         post.js
 *      /route2example
 *         get.js
 *         post.js
 *   definitions.json
 *
 *   todo - much more detail here
 * @param app
 * @param rootDir Root directory of your app
 * @param tileDir
 */
exports.one = function( app, rootDir, tileDir ) {
    var deferred = q.defer();
    bootstrap.start( app, rootDir, function() {
        // when bootstrapping is done
        var promise = tileConfigurator.configureOneDefinitionDir( app, tileDir );
        promise.then( function() {
            // once tile configuration is done, emit the all done signal
            deferred.resolve();
        } );
    } );

    return deferred.promise;
};