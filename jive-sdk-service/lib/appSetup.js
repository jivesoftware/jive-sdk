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
    jive = require('../api'),
    service = require('./service');

var express = require('express');
var baseSetup = require('./baseSetup');
var appSetup = Object.create(baseSetup);
module.exports = appSetup;

function isValidFile(file ) {
    return !(file.indexOf('.') == 0)
}

function setupAppPublicRoutes(osAppDir, app, osAppID) {
    return q.nfcall(fs.stat, osAppDir).then(function (stat) {
        if (stat.isDirectory()) {
            jive.logger.debug("Setting up osapp at " + osAppDir);
            app.use('/osapp/' + osAppID, express.static(osAppDir + '/public'));
            return q.resolve();
        } else {
            return q.resolve();
        }
    });
}

appSetup.setupOneApp = function( app, osAppDir, osAppID ) {
    var svcDir = osAppDir + '/backend';
    var routesPath = osAppDir + '/backend/routes';

    return setupAppPublicRoutes(osAppDir, app, osAppID).then( function() {
        return jive.util.fsexists(svcDir).then( function(exists) {
            return !exists ? q.resolve() : appSetup.setupServices(app, 'app.' + osAppID, svcDir);
        }).then( function() {
            return jive.util.fsexists(routesPath);
        }).then( function(exists) {
            return !exists ? q.resolve() : appSetup.setupRoutes(app, osAppID, routesPath);
        })
    });
};

appSetup.setupAllApps = function( app, appsRootDir ) {
    return jive.util.fsexists( appsRootDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, appsRootDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    if ( !isValidFile(item) ) {
                        return;
                    }
                    var dirPath = appsRootDir + '/' + item ;
                    proms.push(appSetup.setupOneApp(app, dirPath, item));
                });

                return q.all(proms);
            });
        } else {
            return q.resolve();
        }
    });
};