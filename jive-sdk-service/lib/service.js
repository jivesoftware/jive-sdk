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
 * @module service
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
var traverse = require('traverse');

var app;
var rootDir = process.cwd();
var tilesDir = rootDir + '/tiles';
var osAppsDir = rootDir + '/apps';
var cartridgesDir = rootDir + '/cartridges';
var storagesDir = rootDir + '/storages';
var security = require('./security');
var serviceState = 'stopped';

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
 * Service configuration options.
 */
exports.options = {};


/**
 * @deprecated This is just a symlink to jive.community (use that instead). To be removed in next major version.
 * @type {module:community}
 */
exports.community = jive.community;

var persistence;
/**
 * Retrieves or sets current persistence strategy, defaults to file.
 * @param {Object} persistenceStrategy If set, the service will be configured to use the provided strategy.
 * @param {function} persistenceStrategy.find
 * @param {function} persistenceStrategy.findByID
 * @param {function} persistenceStrategy.remove
 * @param {function} persistenceStrategy.save
 * @returns {Object}
 */
exports.persistence = function(persistenceStrategy) {

    if ( persistenceStrategy ) {
        // set persistence
        if ( !persistenceStrategy['find'] || !persistenceStrategy['findByID'] || !persistenceStrategy['remove'] || !persistenceStrategy['save'] ) {
            throw 'Unsupported persistence strategy - must implement find, findByID, remove, save methods.';
        }
        persistence = persistenceStrategy;
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
        },

        sync: function() {
            if ( !persistence ) {
                return q.reject( new Error("persistence not defined") );
            }

            if ( !persistence['sync'] ) {
                return q.resolve();
            }

            return persistence.sync(
                arguments.length > 0 ? arguments[0] : undefined,
                arguments.length > 1 ? arguments[1] : undefined,
                arguments.length > 2 ? arguments[2] : undefined,
                arguments.length > 3 ? arguments[3] : undefined,
                arguments.length > 4 ? arguments[4] : undefined,
                arguments.length > 5 ? arguments[5] : undefined
            );

        }
    }
};

var scheduler;
/**
 * Retrieves or sets the scheduling strategy. Defaults to memory (single node). todo
 * @param {Object} schedulerStrategy If set, the service will be configured to use the provided strategy.
 * @param {function} schedulerStrategy.schedule
 * @param {function} schedulerStrategy.unschedule
 * @param {function} schedulerStrategy.getTasks
 */
exports.scheduler = function( schedulerStrategy ) {
    if ( schedulerStrategy ) {
        if ( !schedulerStrategy['schedule'] || !schedulerStrategy['unschedule'] || !schedulerStrategy['getTasks'] ) {
            throw 'Unsupported scheduler strategy - must implement schedule, unschedule, isScheduled, getTasks.';
        }
        scheduler = schedulerStrategy;

        if ( !scheduler ) {
            scheduler = new jive.scheduler.memory();
        }
        jive.context.scheduler = scheduler;
    }
    scheduler = jive.context.scheduler;
    return scheduler;
};

/**
 * Initializes the service based on the passed-in express app, and any configuration options.
 * If an express app isn't provided, one is created.
 * <ul>
 *      <li>Applies globally applicable middleware to the express app</li>
 *      <li>Configures service role based on options</li>
 *      <li>Sets up service logging based on options</li>
 *      <li>Sets up service persistence based on options</li>
 *      <li>Sets up service scheduler based on options</li>
 * </ul>
 *
 * Environment variable overrides:
 * <ul>
 *     <li>jive_sdk_service_role: optional, one of http, worker, pusher.</li>
 *     <li>jive_sdk_config_file: optional, if set, JSON options will be loaded from this path.</li>
 * </ul>
 * @param expressApp
 * @param {Object} options JSON, or path to the options file.
 */
exports.init = function(expressApp, options ) {
    if (expressApp) {
        app = expressApp;
    } else {
        app = express();
    }
    rootDir =  (options && options['svcRootDir']) || rootDir || process.cwd();
    tilesDir = rootDir + '/tiles';

    // for some reason this needs to be configured earlier than later
    app.use(express.bodyParser());
    if ( options && !options['suppressHttpLogging'] ) {
        app.use(express.logger('dev'));
    }
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.errorHandler());

    // attach security middleware
    app.all( '*', security.checkAuthHeadersMiddleware );

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
        if (process && process.env && process.env.PORT) {
            config['port'] = process.env.PORT;
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

            traverse(jiveConfig).forEach(function(value) {
                if (typeof (value) === 'string') {
                    this.update(mustache.render(value, process.env));
                }
            });

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

        var logFileSize = options['logFileSize'] || undefined;
        var logFileNumBackups = options['logFileNumBackups'] || undefined;
        var logFileLayout = undefined; // Force default layout

        log4js.loadAppender('file');
        log4js.addAppender(log4js.appenders.file(logfile, logFileLayout, logFileSize, logFileNumBackups), 'jive-sdk');
    }

    jive.logger.setLevel(logLevel);

    return options;
}

function initPersistence(options) {

    /**
     * Offered to the persistence strategy; may or may not be used.
     */
    var defaultSchema = {
        'tileDefinition' : {
            'sampleData' : { type: "text", required: false },
            'displayName': { type: "text", required: false },
            'name': { type: "text", required: true, index: true },
            'description': { type: "text", required: false },
            'style': { type: "text", required: false },
            'icons': { type: "text", required: false },
            'action': { type: "text", required: false },
            'id': { type: "text", required: true },
            'definitionDirName': { type: "text", required: false }
        },
        'extstreamsDefinition': {
            'displayName': { type: "text", required: false },
            'name': { type: "text", required: true, index: true },
            'description': { type: "text", required: false },
            'style': { type: "text", required: false },
            'icons': { type: "text", required: false },
            'action': { type: "text", required: false },
            'id': { type: "text", required: true },
            'definitionDirName': { type: "text", required: false }
        },
        'jiveExtension' : {
            'id': { type: "text", required: false },
            'uuid': { type: "text", required: false },
            'name': { type: "text", required: false },
            'systemAdmin': { type: "text", required: false },
            'jiveServiceSignature': { type: "text", required: false }
        },
        'tileInstance' : {
            "url":  { type: "text", required: false },
            "config":  { type: "text", required: false, expandable: true },
            "name":  { type: "text", required: false, index: true },
            "accessToken": { type: "text", required: false },
            "expiresIn": { type: "text", required: false },
            "refreshToken": { type: "text", required: false },
            "scope": { type: "text", required: false },
            "guid": { type: "text", required: false },
            "jiveCommunity": { type: "text", required: false },
            "id": { type: "text", required: true }
        },
        'community': {
            "id": { type: "text", required: false },
            "jiveUrl": { type: "text", required: false, index: true },
            "version":{ type: "text", required: false },
            "tenantId": { type: "text", required: false, index: true },
            "clientId": { type: "text", required: false },
            "clientSecret": { type: "text", required: false },
            "jiveCommunity": { type: "text", required: false },
            "oauth": { type: "text", required: false }
        }
    };

    var persistence = options['persistence'];
    if ( typeof persistence === 'object' ) {
        // set persistence if the object is provided
        exports.persistence( options['persistence'] );
    }
    else if ( typeof persistence === 'string' ) {
        //If a string is provided, and it's a valid type exported in jive.persistence, then use that.
        options['schema'] = defaultSchema;

        if (jive.persistence[persistence]) {
            exports.persistence(new jive.persistence[persistence](options)); //pass options, such as location of DB for mongoDB.
        } else {
            // finally try to require the persistence strategy
            try {
                var persistenceStrategy = require(process.cwd() + '/node_modules/' + persistence);
                exports.persistence(new persistenceStrategy(options));
            } catch ( e ) {
                jive.logger.error(e);
                jive.logger.warn('Invalid persistence option given "' + persistence + '". Must be one of ' + Object.keys(jive.persistence));
                process.exit(-1);
            }
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
            // finally try to require the scheduler strategy
            try {
                var schedulerStrategy = require(process.cwd() + '/node_modules/' + scheduler);
                exports.scheduler(new schedulerStrategy(options));
            } catch ( e ) {
                jive.logger.error(e);
                jive.logger.warn('Invalid scheduler option given "' + scheduler + '". Must be one of ' + Object.keys(jive.scheduler));
                process.exit(-1);
            }
        }
    }
    return options;
}

/**
 * Autowires the entire service. Service autowiring will setup:
 * <ul>
 *     <li>Public web assets such as html, javascript, and images available from the /public directory</li>
 *     <li>Public endpoints ('routes') shared by all components</li>
 *     <li>Public endpoints ('routes') for each service subcomponent</li>
 *     <li>Event listeners</li>
 *     <li>Recurrent tasks</li>
 *     <li>Execute serivce component bootstrap code</li>
 * </ul>
 * @param {Object} options Autowiring options. If not present, all service components (tiles, apps, services, storage frameworks, etc.) will
 * be autowired.
 * @param {String} options.componentsToWire Polymorphic, optional field. If present and value is 'all', then all service components will be autowired.
 * Otherwise, if present and value is list of one or more of <b>tiles</b>, <b>apps</b>, <b>services</b>, and <b>storages</b>, the specified components are autowired.
 * @returns {Promise} Promise
 */
exports.autowire = function(options) {
    var doTiles = true;
    var doApps = true;
    var doServices = true;
    var doStorages = true;

    if ( options ) {
        var componentsToWire = options['componentsToWire'];
        if ( componentsToWire ) {
            if ( componentsToWire !== 'all' && componentsToWire['indexOf'] ) {
                if ( !componentsToWire.indexOf['tiles'] ) {
                    doTiles = false;
                }
                if ( !componentsToWire.indexOf['apps'] ) {
                    doApps = false;
                }
                if ( !componentsToWire.indexOf['services'] ) {
                    doServices = false;
                }
                if ( !componentsToWire.indexOf['storages'] ) {
                    doStorages = false;
                }
            }
        }
    }

    return ( doTiles ? definitionConfigurator.setupAllDefinitions(app, _dir( '/tiles', '/tiles')) : q.resolve() )
    .then( function () {
        return ( doApps ? osAppConfigurator.setupAllApps( app, _dir( '/apps', '/apps')) : q.resolve() )
    })
    .then( function () {
        return ( doServices ? serviceConfigurator.setupAllServices( app, _dir( '/services', '/services')) : q.resolve() )
    })
    .then( function () {
        return ( doStorages ? serviceConfigurator.setupAllServices( app, _dir( '/storages', '/storages')) : q.resolve );
    });
};

/**
 * Return promise - fail or succeed
 * @returns {Promise} promise
 */
exports.start = function() {
    serviceState = 'starting';
    return bootstrap.start( app, exports.options, rootDir, tilesDir, osAppsDir, cartridgesDir, storagesDir).then( function() {
        if (app['settings'] && app['settings']['env']) {
            jive.logger.info("Service started in " + app['settings']['env'] + " mode");
            serviceState = 'started';
        }
        return q.resolve();
    });
};

/**
 * Halt the service.
 * @returns {Promise} promise
 */
exports.stop = function() {
    return bootstrap.teardown().then( function() {
        jive.logger.info("Service stopped.");
        serviceState = 'stopped';
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
 * @property {Object} tiles
 * @property {Object} jive
 * @property {Object} dev
 * @property {Object} oauth
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

/**
 * API for managing add-on extensions.
 * @returns {module:extensions}
 */
exports.extensions = function() {
    return require('./extension/extension');
};

/**
 * @private
 * @param all
 * @returns {Array}
 */
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

/**
 * API for managing service security
 * @returns {module:security}
 */
exports.security = function() {
    return security;
};

/**
 * @returns {boolean} Returns true if service configuration options has 'development' : true set.
 */
exports.isDevelopment = function() {
    return exports.options['development'] === true;
};

/**
 * @returns {string}
 */
exports.serviceStatus = function() {
    return serviceState;
};
