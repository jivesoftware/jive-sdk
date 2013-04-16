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

var q = require('q');
var bootstrap = require('./bootstrap');
var definitionConfigurator = require('./definitionConfigurator');

var app;
var rootDir;

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

/**
 * @param _app
 * @param options JSON or path
 * @param rootDir optional
 */
exports.init = function(_app, options, _rootDir ) {
    return q.fcall(function(){
        app = _app;
        rootDir = _rootDir || process.cwd();

        // if no options are provided, then try getting them from
        // cmd line arguments, or from environemnt
        if ( !options ) {
            var configFileFromEnv = process.env['CONFIG_FILE'];
            var configFilePathFromArgs;

            process.argv.forEach(function (val, index, array) {
                if ( val.indexOf('=') > -1 ) {
                    var arg = val.split(/=/);
                    console.log(arg[0],'=',arg[1]);

                    if ( arg[0] == 'configFile' ) {
                        console.log("Command line argument:");
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

        exports.options = options;
    });
};


/**
 */
exports.autowire = function(tileRootDirectory) {
    return definitionConfigurator.setupAllDefinitions(app, _dir( tileRootDirectory, '/tiles') );
};

/**
 * Autowire a single definition via its directory
 * @param definitionName
 * @param directory
 */
exports.autowireDefinition = function( definitionName, directory ) {
    return definitionConfigurator.setupOneDefinition(
        app, _dir(directory, '/tiles/' + definitionName), definitionName
    );
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
    return bootstrap.start( app, exports.options, rootDir );
};



