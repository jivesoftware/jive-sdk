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

var persistence = require('../persistence/dispatcher');

function Applications() {
}

Applications.prototype = Object.create({}, {
    constructor: {
        value: Applications,
        enumerable: false
    }
});

module.exports = Applications;

var returnOne = function(found, callback ) {
    if ( found == null || found.length < 1 ) {
        callback( null );
    } else {
        // return first one
        callback( found[0] );
    }
};

Applications.prototype.getCollection = function() {
    return "application";
};

Applications.prototype.save = function (application) {
    var self = this;

    return {
        execute: function (callback) {
            persistence.save(self.getCollection(), application.clientId, application, function (saved) {
                callback(saved);
            });
        }
    };
};

Applications.prototype.find = function ( keyValues, expectOne ) {
    var self = this;

    return {
        execute: function (callback) {
            persistence.find(self.getCollection(), keyValues, function( found ) {
                if ( expectOne ) {
                    returnOne( found, callback )
                } else {
                    callback ( found );
                }
            } );
        }
    };
};

Applications.prototype.findByAppName = function (appname) {
    return this.find( { "name": appname }, true );
};

Applications.prototype.findAll = function () {
    return this.find( null );
};

Applications.prototype.findByID = function (clientId) {
    return this.find( { "clientId": clientId }, true );
};

Applications.prototype.remove = function (clientId) {
    var self = this;
    return {
        execute: function (callback) {
            persistence.remove(self.getCollection(), clientId, callback);
        }
    };
};