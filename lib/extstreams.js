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
 * Library for manipulating external stream instances.
 */

var q = require('q');
var util = require('util');
var instances = require('./instances');
var pusher = require('./dataPusher');

var extstreams = Object.create(instances);
module.exports = extstreams;

extstreams.getCollection = function() {
    return "extstreamInstance";
};

extstreams.pushActivity = function ( tileInstance, activity) {
    var deferred = q.defer();

    pusher.pushActivity(tileInstance, activity, function(result ){
        deferred.resolve(result);
    }, function(e) {
        deferred.reject( e );
    });

    return deferred.promise;
};

extstreams.pushComment = function ( tileInstance, comment, commentURL) {
    var deferred = q.defer();

    pusher.pushComment(tileInstance, commentURL, comment, function(result) {
        deferred.resolve( result );
    }, function(e) {
        deferred.reject( e );
    });

    return deferred.promise;
};

