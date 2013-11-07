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
var osAppConfigurator = require('./appSetup');
var serviceConfigurator = require('./serviceSetup');
var jive = require('../api');
var log4js = require('log4js');
var mustache = require('mustache');
var url = require('url');

var app;
var rootDir = process.cwd();
var tilesDir = rootDir + '/tiles';
var osAppsDir = rootDir + '/apps';
var cartridgesDir = rootDir + '/cartridges';
var storagesDir = rootDir + '/storages';

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
 * For managing jive communities registered with this service
 */
exports.community = jive.community;

/**
 * For managing service webhooks
 */
exports.webhooks = jive.webhooks;

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
        // set persistence
        if ( !_persistence['find'] || !_persistence['findByID'] || !_persistence['remove'] || !_persistence['save'] ) {
            throw 'Unsupported persistence strategy - must implement find, findByID, remove, save methods.';
        }
        persistence = _persistence;
        jive.context['persistence'] = persistence;
    }

    // retrieve persistence
    return {
        save: function() {
            return persistence ? persistence.save(
                arguments.length > 0 ? arguments[0] : undefined,
                arguments.length > 1 ? arguments[1] : undefined,
                arguments.length > 2 ? arguments[2] : undefined,
                arguments.length > 3 ? arguments[3] : undefined,
                arguments.length > 4 ? arguments[4] : undefined,
                arguments.length > 5 ? arguments[5] : undefined
            ) : function() {
                return q.reject( new Error("persistence not defined") );
            }
        },

        find: function() {
            return persistence ? persistence.find(
                arguments.length > 0 ? arguments[0] : undefined,
                arguments.length > 1 ? arguments[1] : undefined,
                arguments.length > 2 ? arguments[2] : undefined,
                arguments.length > 3 ? arguments[3] : undefined,
                arguments.length > 4 ? arguments[4] : undefined,
                arguments.length > 5 ? arguments[5] : undefined
            ) : function() {
                return q.reject( new Error("persistence not defined") );
            }
        },

        findByID: function() {
            return persistence ? persistence.findByID(
                arguments.length > 0 ? arguments[0] : undefined,
                arguments.length > 1 ? arguments[1] : undefined,
                arguments.length > 2 ? arguments[2] : undefined,
                arguments.length > 3 ? arguments[3] : undefined,
                arguments.length > 4 ? arguments[4] : undefined,
                arguments.length > 5 ? arguments[5] : undefined
            ) : function() {
                return q.reject( new Error("persistence not defined") );
            }
        },

        remove: function() {
            return persistence ? persistence.remove(
                arguments.length > 0 ? arguments[0] : undefined,
                arguments.length > 1 ? arguments[1] : undefined,
                arguments.length > 2 ? arguments[2] : undefined,
                arguments.length > 3 ? arguments[3] : undefined,
                arguments.length > 4 ? arguments[4] : undefined,
                arguments.length > 5 ? arguments[5] : undefined
            ) : function() {
                return q.reject( new Error("persistence not defined") );
            }
        },

        close: function() {
            return persistence ? persistence.close() :  function() {
                return q.reject( new Error("persistence not defined") );
            }
        }
    }
};

var scheduler;
/**
 * Retrieves or sets the scheduling strategy. Defaults to memory (single node). todo
 * @param _scheduler
 * @returns {*}
 */
exports.scheduler = function( _scheduler ) {
    if ( _scheduler ) {
        if ( !_scheduler['schedule'] || !_scheduler['unschedule'] || !_scheduler['getTasks'] ) {
            throw 'Unsupported scheduler strategy - must implement schedule, unschedule, isScheduled, getTasks.';
        }
        scheduler = _scheduler;

        if ( !scheduler ) {
            scheduler = new jive.scheduler.memory();
        }
        jive.context.scheduler = scheduler;
    }
    scheduler = jive.context.scheduler;
    return scheduler;
};

/**
 * @param _app
 * @param options JSON or path to options file
 * @param definitionsToAutowire optional arraylist of tile names under [app root]/tiles to autowire
 */
exports.init = function(_app, options ) {
    if (_app) {
        app = _app;
    }
    else {
        app = express();
    }
    rootDir =  rootDir || process.cwd();
    tilesDir = rootDir + '/tiles';

    // for some reason this needs to be configured earlier than later
    app.use(express.bodyParser());
    app.use(express.logger('dev'));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());

    var applyDefaults = function(config) {
        if ( !config['persistence'] ) {
            config['persistence'] = 'file';
        }
        if ( !config['scheduler'] ) {
            config['scheduler'] = 'memory';
        }
    };

   var applyOverrides = function(config) {
        // override role
        var roleFromEnv = process.env['jive_sdk_service_role'];
        if ( roleFromEnv ) {
            config['role'] = roleFromEnv;
        }
    };

    var initialPromise;
    if ( typeof options === 'object' ) {
        applyDefaults(options);
        applyOverrides(options);
        exports.options = options;
        jive.context.config = exports.options;

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
            applyDefaults(jiveConfig);
            applyOverrides(jiveConfig);

            exports.options = jiveConfig;
            jive.context.config = exports.options;

            jive.logger.debug('Startup configuration from', options);
            jive.logger.debug(jiveConfig);

            return jiveConfig;
        });
    }

    return initialPromise
            .then(initLogger)
            .then(initPersistence)
            .then(initScheduler);
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
            exports.persistence(new jive.persistence[persistence](options)); //pass options, such as location of DB for mongoDB.
        }
        else {
            jive.logger.warn('Invalid persistence option given "' + persistence + '". Must be one of ' + Object.keys(jive.persistence));
            jive.logger.warn('Defaulting to file persistence');
        }
    }
    return options;
}

function initScheduler(options) {
    var scheduler = options['scheduler'];
    if ( typeof scheduler === 'object' ) {
        // set scheduler if the object is provided
        exports.scheduler(scheduler);
    }
    else if ( typeof scheduler === 'string' ) {
        //If a string is provided, and it's a valid type exported in jive.scheduler, then use that.
        if (jive.scheduler[scheduler]) {
            exports.scheduler(new jive.scheduler[scheduler](options)); //pass options, such as location of redis for Kue.
        }
        else {
            jive.logger.warn('Invalid scheduler option given "' + scheduler + '". Must be one of ' + Object.keys(jive.scheduler));
            jive.logger.warn('Defaulting to memory scheduler');
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
        return definitionConfigurator.setupAllDefinitions(app, _dir( '/tiles', '/tiles'))
        .then( function () {
            return osAppConfigurator.setupAllApps( app, _dir( '/apps', '/apps'));
        })
        .then( function () {
            return serviceConfigurator.setupAllServices( app, _dir( '/services', '/services'));
        })
        .then( function () {
            return serviceConfigurator.setupAllServices( app, _dir( '/storages', '/storages'));
        });
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
    return bootstrap.start( app, exports.options, rootDir, tilesDir, osAppsDir, cartridgesDir, storagesDir).then( function() {
        jive.logger.info("Service started in " + app['settings']['env'] + " mode");
    });
};

/**
 * Computes the full service URL for this service, taking into account
 * jiveclientconfiguration.json (clientUrl & port)
 */
exports.serviceURL = function() {
    var conf = jive.service.options;
    var clientUrlExcludesPort = conf['clientUrlExcludesPort'];
    var clientUrl = conf['clientUrl'];
    var port = conf['port'];
    if ( !clientUrlExcludesPort && port && port != 443 && port != 80 ) {
        var urlParts = url.parse(clientUrl);
        urlParts['port'] = port;
        urlParts['host'] = null;
        clientUrl = url.format(urlParts);
        if ( clientUrl.lastIndexOf( '/') == clientUrl.length-1 ) {
            clientUrl = clientUrl.substring( 0, clientUrl.length - 1);
        }
    }

    return clientUrl;
};

/**
 * Public service routes
 */
exports.routes = {
    'tiles' : require('../routes/tiles'),
    'jive' : require('../routes/jive'),
    'dev' : require('../routes/dev'),
    'oauth' : require('../routes/oauth')
};

/**
 * Interrogate the role of this node
 */
exports.role = {
    'isWorker' : function() {
        return !exports.options['role'] || exports.options['role'] === jive.constants.roles.WORKER;
    },
    'isPusher' : function() {
        return !exports.options['role'] || exports.options['role'] === jive.constants.roles.PUSHER;
    },
    'isHttp' : function() {
        return !exports.options['role'] || exports.options['role'] === jive.constants.roles.HTTP_HANDLER;
    }
};

exports.extensions = function() {
    return require('./extension/extension');
};

exports.getExpandedTileDefinitions = function(all) {
    var conf = exports.options;
    var host = exports.serviceURL();
    var processed = [];

    all.forEach( function( tile ) {
        if ( !tile ) {
            return;
        }
        var name = tile.name;
        var stringified = JSON.stringify(tile);
        stringified =  mustache.render(stringified, {
            host: host,
            tile_public: host + '/' + name,
            tile_route: host + '/' + name,
            clientId: conf.clientId
        });

        var processedTile = JSON.parse(stringified);

        // defaults
        if ( !processedTile['published'] ) {
            processedTile['published'] = "2013-02-28T15:12:16.768-0800";
        }
        if ( !processedTile['updated'] ) {
            processedTile['updated'] = "2013-02-28T15:12:16.768-0800";
        }
        if ( processedTile['action'] ) {
            if ( processedTile['action'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['action'] = host + ( processedTile['action'].indexOf('/') == 0 ? "" : "/" ) + processedTile['action'];
            }
        }
        if ( !processedTile['config'] ) {
            processedTile['config'] = host + '/' + processedTile['definitionDirName'] + '/configure';
        } else {
            if ( processedTile['config'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['config'] = host + ( processedTile['config'].indexOf('/') == 0 ? "" : "/" ) + processedTile['config'];
            }
        }
        if ( !processedTile['unregister']) {
            processedTile['unregister'] = host + '/unregister';
        } else {
            if ( processedTile['unregister'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['unregister'] = host + ( processedTile['unregister'].indexOf('/') == 0 ? "" : "/" ) + processedTile['unregister'];
            }
        }

        if ( !processedTile['register'] ) {
            processedTile['register'] = host + '/registration';
        } else {
            if ( processedTile['register'].indexOf('http') != 0 ) {
                // assume its relative to host then
                processedTile['register'] = host + ( processedTile['register'].indexOf('/') == 0 ? "" : "/" ) + processedTile['register'];
            }
        }
        if ( processedTile['unregister'] && processedTile['unregister'].indexOf('http') != 0 ) {
            // assume its relative to host then
            processedTile['unregister'] = host + ( processedTile['unregister'].indexOf('/') == 0 ? "" : "/" ) + processedTile['unregister'];
        }
        if ( !processedTile['client_id'] ) {
            processedTile['client_id'] = conf.clientId;
        }
        if ( !processedTile['id'] ) {
            processedTile['id'] = '{{{definition_id}}}';
        }

        if (conf.clientId) {
            processedTile.description += ' for ' + conf.clientId;
        }
        processed.push( processedTile );
    });
    return processed;
};
