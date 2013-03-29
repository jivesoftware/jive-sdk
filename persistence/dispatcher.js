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

var util            = require('util'),
    events          = require('events'),
    filePersistence = require('./file');

var persistenceListener = null;

var Dispatcher = function () {
    events.EventEmitter.call(this);
};

util.inherits(Dispatcher, events.EventEmitter);

var dispatcher = new Dispatcher();

function setListener( listener ) {
    persistenceListener = listener ? listener : filePersistence.persistenceListener();

    dispatcher.on('save', persistenceListener.save);
    dispatcher.on('findByID', persistenceListener.findByID);
    dispatcher.on('findAll', persistenceListener.findAll);
    dispatcher.on('remove', persistenceListener.remove);
}

function lazyInit() {
    if ( !persistenceListener ) {
        setListener( new filePersistence.persistenceListener() );
    }
}

//////////////////////////////////////////////////////////////
// public
//////////////////////////////////////////////////////////////

exports.save = function (collectionID, key, data, callback) {
    lazyInit();
    dispatcher.emit('save', collectionID, key, data, callback);
};

exports.findByID = function (collectionID, key, callback) {
    lazyInit();
    dispatcher.emit('findByID', collectionID, key, callback);
};

exports.findAll = function (collectionID, callback) {
    lazyInit();
    dispatcher.emit('findAll', collectionID, callback);
};

exports.remove = function (collectionID, key, callback) {
    lazyInit();
    dispatcher.emit('remove', collectionID, callback);
};

exports.setListener = setListener;

