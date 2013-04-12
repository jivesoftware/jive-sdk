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

var http                = require('http'),
    persistence         = require('./persistence/dispatcher'),
    jiveClient          = require('./client')
;

exports.setPersistenceListener = function( listener ) {
    persistence.setListener(listener);
};

var returnOne = function(found, callback ) {
    if ( found == null || found.length < 1 ) {
        callback( null );
    } else {
        // return first one
        callback( found[0] );
    }
};

exports.Application = {

    save: function (application) {

        return {
            execute: function (callback) {
                persistence.save("application", application.clientId, application, function (saved) {
                    callback(saved);
                });
            }
        };
    },

    find: function ( keyValues, expectOne ) {
        return {
            execute: function (callback) {
                persistence.find("application", keyValues, function( found ) {
                    if ( expectOne ) {
                        returnOne( found, callback )
                    } else {
                        callback ( found );
                    }
                } );
            }
        };
    },

    findByAppName: function (appname) {
        return exports.Application.find( { "name": appname }, true );
    },

    findAll: function () {
        return exports.Application.find( null );
    },

    findByID: function (clientId) {
        return exports.Application.find( { "clientId": clientId }, true );
    },

    remove: function (clientId) {
        return {
            execute: function (callback) {
                persistence.remove("application", clientId, callback);
            }
        };
    }

};

////////////////////////////////////////////////////////////////////
// todo - the new stuff goes here... eventually everything above will migrate!

//////
exports.persistence = {
    'file' : require('./persistence/file'),
    'memory' : require('./persistence/memory'),
    'mongo' : require('./persistence/mongo')
};

//////
exports.config = require('./lib/config');

//////
var extstreamsDefinitions = require('./lib/extstreamsDefinitions');
var extstreams = new (require('./lib/extstreams'));
extstreams['definitions'] = new extstreamsDefinitions();
exports.extstreams = extstreams;

//////
var tileDefinitions = require('./lib/tilesDefinitions');
var tiles = new (require('./lib/tiles'));
tiles['definitions'] = new tileDefinitions();
exports.tiles = tiles;
