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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var fs = require('fs');
var path = require('path');
var express = require('express');
var q = require('q');
var bootstrap = require('./bootstrap');
var definitionConfigurator = require('./definitionSetup');
var jive = require('../api');
var log4js = require('log4js');

var app;
var rootDir = process.cwd();
var tilesDir = rootDir + '/tiles';

var _dir = function(theDir, defaultDir ) {
    theDir = theDir || defaultDir;

    if ( theDir.indexOf('/') == 0 ) {
        return rootDir + theDir;
    } else {
        return process.cwd() + '/' + theDir;
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Configuration options
 */
exports.options = {};

var persistence;
/**
 * Retrieves or sets current persistence strategy, defaults to file.
 * @type {undefined}
 */
exports.persistence = function(_persistence) {

    if ( _persistence ) {
        if ( !_persistence['find']  || !_persistence['remove'] || !_persistence['save'] ) {
            throw 'Unsupported persistence strategy - must implement find, remove, save methods.';
        }
        persistence = _persistence;
    }

    if ( !persistence) {
        persistence = new jive.persistence.file();
    }
    return persistence;
};

/**
 * @param _app
 * @param options JSON or path to options file
 * @param definitionsToAutowire optional arraylist of tile names under [app root]/tiles to autowire
 */
exports.init = function(_app, options ) {
    app = _app;
    rootDir =  rootDir || process.cwd();
    tilesDir = rootDir + '/tiles';

    // for some reason this needs to be configured earlier than later
    app.use(express.bodyParser());
    app.use(express.logger('dev'));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());

    var initialPromise;
    if ( typeof options === 'object' ) {
        exports.options = options;

        initialPromise = q.fcall( function() {
            return options;
        });
    } else {
        // if no options are provided, then try getting them from
        // cmd line arguments, or from environemnt
        if ( !options ) {
            var configFileFromEnv = process.env['jive_sdk_config_file'];
            var configFilePathFromArgs = undefined;

            process.argv.forEach(function (val, index, array) {
                if ( val.indexOf('=') > -1 ) {
                    var arg = val.split(/=/);


                    if ( arg[0] == 'configFile' ) {
                        jive.logger.debug("Command line argument:"  + arg[0] + "=" + arg[1]);
                        configFilePathFromArgs = arg[1];
                    }
                }
            });

            options = configFilePathFromArgs || configFileFromEnv;

            if( !options ) {
                // assume its a file in the rootdir
                options = rootDir + "/jiveclientconfiguration.json";
            }
        }

        initialPromise = q.nfcall( fs.readFile, options, 'utf8').then( function (data) {
            var jiveConfig = JSON.parse(data);
            exports.options = jiveConfig;

            jive.logger.debug('Startup configuration from', options);
            jive.logger.debug(jiveConfig);

            return jiveConfig;
        });
    }

    return initialPromise
            .then(initLogger)
            .then(initPersistence);
};

function initLogger(options) {
    var logfile = options['logFile'] || options['logfile'];
    var logLevel = process.env['jive_logging_level'] || options['logLevel'] || options['loglevel'] || 'INFO';
    logLevel = logLevel.toUpperCase();

    if (logfile) {
        if (logfile.indexOf('logs/') === 0) {
            if (!fs.existsSync('logs')) {
                jive.logger.warn('logs subdirectory does not exist. Creating directory now.');
                fs.mkdirSync('logs');
            }
        }
        log4js.loadAppender('file');
        log4js.addAppender(log4js.appenders.file(logfile), 'jive-sdk');
    }

    jive.logger.setLevel(logLevel);

    return options;
}

function initPersistence(options) {
    var persistence = options['persistence'];
    if ( typeof persistence === 'object' ) {
        // set persistence if the object is provided
        exports.persistence( options['persistence'] );
    }
    else if ( typeof persistence === 'string' ) {
        //If a string is provided, and it's a valid type exported in jive.persistence, then use that.
        if (jive.persistence[persistence]) {
            exports.persistence(new jive.persistence[persistence]());
        }
        else {
            jive.logger.warn('Invalid persistence option given "' + persistence + '". Must be one of ' + Object.keys(jive.persistence));
            jive.logger.warn('Defaulting to file persistence');
        }
    }
    return options;
}

/**
 *
 */
exports.autowire = function(definitionsToAutowire) {
    if( definitionsToAutowire ) {

        if (definitionsToAutowire['forEach'] ) {
            var promises = [];
            definitionsToAutowire.forEach( function( definition ) {
                promises.push( definitionConfigurator.setupOneDefinition(
                    app, _dir( '/tiles/' + definition), definition
                ) );
            });
            return q.all(promises);
        } else {
            return definitionConfigurator.setupOneDefinition(
                app, _dir( '/tiles/' + definitionsToAutowire), definitionsToAutowire
            );
        }
    } else {
        // assume autowiring everything
        return definitionConfigurator.setupAllDefinitions(app, _dir( '/tiles', '/tiles') );
    }
};

/**
 * Autowire a routes directory for a given definition
 * @param definitionName
 * @param definitionRouteDirectory
 */
exports.autowireDefinitionRoutes = function( definitionName, definitionRouteDirectory ) {
    return definitionConfigurator.setupDefinitionRoutes(
        app, definitionName, _dir(definitionRouteDirectory, '/tiles/' + definitionName + '/routes' )
    );
};

/**
 * Autowire a services directory for a given definition
 * @param definitionName
 * @param definitionServicesDirectory
 */
exports.autowireDefinitionServices = function( definitionName, definitionServicesDirectory ) {
    return definitionConfigurator.setupDefinitionServices(
        definitionName, _dir( definitionServicesDirectory, '/tiles/' + definitionName + '/services' )
    );
};

/**
 * Autowire definition metadata file for a given definition
 * @param definitionMetadataFile
 */
exports.autowireDefinitionMetadata = function( definitionMetadataFile ) {
    return definitionConfigurator.setupDefinitionMetadata(definitionMetadataFile);
};

/**
 * Return promise - fail or succeed
 */
exports.start = function() {
    return bootstrap.start( app, exports.options, rootDir, tilesDir).then( function() {
        jive.logger.info("Service started in " + app['settings']['env'] + " mode");
    });
};



