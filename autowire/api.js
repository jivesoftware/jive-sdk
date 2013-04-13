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
 * to automagically configure your tiles by either (1) providing a base directory
 * of your tiles, or (2) providing a directory for one of the tiles to configure.
 */

var bootstrap = require('./bootstrap');
var tileConfigurator = require('./tileConfigurator');

/**
 * Autowire all the tile directories found under the provided tile root directory.
 * @param app
 * @param rootDir
 */
exports.all = function( app, rootDir ) {
    bootstrap.start( app, rootDir );
};

/**
 * Autowire a single tile root diretory. The expected structure under that directory looks like
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
 * @param tileDir
 * @param callback
 */
exports.one = function( app, tileDir, callback ) {
    var promise = tileConfigurator.configureOneTileDir( app, tileDir );
    promise.then( callback );
};