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
 * Library for manipulating tile instances.
 */

var q = require('q');
var util = require('util');
var jive = require('../../api');
var instances = require('./instances');
var pusher = require('./dataPusher');

var tiles = Object.create(instances);
module.exports = tiles;

tiles.getCollection = function() {
    return "tileInstance";
};

tiles.pushData = function (tileInstance, data) {
    return pusher.pushData(tileInstance, data);
};

