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

var fs = require('fs'),
    q  = require('q'),
    path  = require('path'),
    jive = require('../api'),
    service = require('./service');

var express = require('express');
var consolidate = require('consolidate');

var baseSetup = require('./baseSetup');
var serviceSetup = Object.create(baseSetup);
module.exports = serviceSetup;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

function isValidFile(file ) {
    return !(file.indexOf('.') == 0)
}

function fsexists(path) {
    var deferred = q.defer();
    var method = fs.exists ? fs.exists : require('path').exists;
    method( path, function(exists ) {
        deferred.resolve(exists);
    });

    return deferred.promise;
}

function setupPublicRoutes(serviceDir, app) {
    return q.nfcall(fs.stat, serviceDir).then(function (stat) {
        if (stat.isDirectory()) {
            jive.logger.debug("Setting up service at " + serviceDir);
            var serviceName = path.basename(serviceDir);
            app.use('/service/' + serviceName, express.static(serviceDir + '/public'));
            return q.resolve(serviceName);
        } else {
            return q.resolve();
        }
    });
}

/**
 */
serviceSetup.setupServiceRoutes = function(app, serviceName, routesPath){
    return serviceSetup.setupRoutes( app, serviceName, routesPath );
};

function setupBackendRoutes(app, serviceDir, serviceName, routesPath){
    var promises = [];

    promises.push( fsexists(routesPath).then( function(exists) {
        if ( exists ) {
            return serviceSetup.setupRoutes( app, serviceName, routesPath);
        }
    }));
}

serviceSetup.setupOneService = function( app, serviceDir ) {
    return setupPublicRoutes(serviceDir, app).then( function(serviceName) {
        if (!serviceName)  {
            return q.resolve();
        }

        // setup services public directory
        var servicesApp = express();

        servicesApp.engine('html', consolidate.mustache);
        servicesApp.set('view engine', 'html');
        servicesApp.set('views', serviceDir + '/public');
        app.use( servicesApp );

        var routesPath = serviceDir + '/backend/routes';
        var servicesPath = serviceDir + '/backend';

        var promises = [];

        promises.push( fsexists(serviceDir).then( function(exists) {
            if ( exists ) {
                return setupBackendRoutes( servicesApp, serviceDir, serviceName, routesPath );
            }
        }));

        promises.push( serviceSetup.setupServiceServices(app, serviceName, servicesPath ) );

        return q.all(promises);
    })
};

serviceSetup.setupAllServices = function( app, servicesRootDir ) {
    return jive.util.fsexists( servicesRootDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, servicesRootDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    if ( !isValidFile(item) ) {
                        return;
                    }
                    var dirPath = servicesRootDir + '/' + item ;
                    proms.push(serviceSetup.setupOneService(app, dirPath, item));
                });

                return q.all(proms);
            });
        } else {
            return q.resolve();
        }
    });
};

/**
 */
serviceSetup.setupServiceServices = function( app, definitionName, svcDir ) {
    /////////////////////////////////////////////////////
    // apply definition specific tasks, life cycle events, etc.

    function setupDefinitionEventListener(handlerInfo, definitionName) {
        if (!handlerInfo['event']) {
            throw new Error('Event handler "'
                + definitionName + '" must specify an event name.');
        }
        if (!handlerInfo['handler']) {
            throw new Error('Event handler "'
                + definitionName + '" must specify a function handler.');
        }

        if (jive.events.globalEvents.indexOf(handlerInfo['event']) != -1) {
            jive.events.addSystemEventListener(handlerInfo['event'], handlerInfo['handler']);
        } else {
            jive.events.addDefinitionEventListener(
                handlerInfo['event'],
                definitionName,
                handlerInfo['handler'],
                handlerInfo['description'] || 'Unique to definition'
            );
        }
    }

    return serviceSetup.setupServices(app, definitionName, svcDir, setupDefinitionEventListener, 'tileName');
};