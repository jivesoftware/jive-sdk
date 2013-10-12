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

function isValidFile(file ) {
    return !(file.indexOf('.') == 0)
}

exports.setupOneApp = function( app, osAppDir, osAppID ) {
    return q.nfcall( fs.stat, osAppDir ).then( function( stat ) {
        if ( stat.isDirectory() ) {
            jive.logger.debug("Setting up osapp at " + osAppDir);
            app.use( '/osapp/' + osAppID, express.static( osAppDir + '/public' ) );
            return q.resolve();
        } else {
            return q.resolve();
        }
    });
};

exports.setupAllApps = function( app, appsRootDir ) {
    return jive.util.fsexists( appsRootDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, appsRootDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    if ( !isValidFile(item) ) {
                        return;
                    }
                    var dirPath = appsRootDir + '/' + item ;
                    proms.push(exports.setupOneApp(app, dirPath, item));
                });

                return q.all(proms);
            });
        } else {
            return q.resolve();
        }
    });
};