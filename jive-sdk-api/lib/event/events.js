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

var events = require('events');
var jive = require('../../api');
var pusher = require('../tile/dataPusher');
var comments = require('../tile/comments');
var regHandler = require('../tile/registration.js');
var q = require('q');

exports = module.exports = new events.EventEmitter();

exports.eventHandlerMap = {};

exports.addDefinitionEventListener = function( event, definitionName, handler, description ) {
    jive.logger.debug("Registered event for", definitionName,": '" + event + "' ", description ||'' );
    exports.addListener( event+'.'+definitionName, handler );
    if ( !exports.eventHandlerMap[definitionName] ) {
        exports.eventHandlerMap[definitionName] = {};
    }
    exports.eventHandlerMap[definitionName][event] = handler;
};

exports.addSystemEventListener = function(event, handler, description) {
    jive.logger.debug("Registered system event ", event,": ", description);
    if (!exports.eventHandlerMap[event]) {
        exports.addListener(event, handler);
        exports.eventHandlerMap[event] = handler;
    }
};

exports.addLocalEventListener = function( event, handler ) {
    exports.addListener( event, handler );
};

/**
 * There are events that pusher nodes are allowed to handle.
 * @type {Array}
 */
exports.pushQueueEvents = [
    'pushDataToJive',
    'pushActivityToJive',
    'pushCommentToJive'
];

/**
 * This is an array of system defined events
 * @type {Array}
 */
exports.baseEvents = [
    {
        'event': 'newInstance',
        'handler' : function(theInstance){
            jive.logger.info("A new instance was created", theInstance);
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'destroyingInstance',
        'handler' : function(theInstance){
            jive.logger.info("Instance is being destroyed", theInstance);
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'destroyedInstance',
        'handler' : function(theInstance){
            jive.logger.info("Instance has been destroyed", theInstance);
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'dataPushed',
        'handler' : function(theInstance, pushedData, response){
            jive.logger.info('Data push to', theInstance.url, response ? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'activityPushed',
        'handler' : function(theInstance, pushedData, response){
            jive.logger.info('Activity push to', theInstance.url, response ? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'commentPushed',
        'handler' : function(theInstance, pushedData, response){
            jive.logger.info('Comment push to', theInstance.url, response ? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },
    {
        'event':'pushDataToJive',
        'handler':function(context) {
            var tileInstance = context['tileInstance'];
            var data = context['data'];
            return pusher.pushData(tileInstance, data);
        },
        'description' : 'Framework handler'
    },
    {
        'event':'pushActivityToJive',
        'handler':function(context) {
            var tileInstance = context['tileInstance'];
            var activity = context['activity'];
            return pusher.pushActivity(tileInstance, activity);
        },
        'description' : 'Framework handler'
    },
    {
        'event':'pushCommentToJive',
        'handler':function(context) {
            var tileInstance = context['tileInstance'];
            var data = context['data'];
            var commentURL = context['commentURL'];
            var comment = context['comment'];
            return pusher.pushComment(tileInstance, commentURL, comment);
        },
        'description' : 'Framework handler'
    },
    {
        'event':'commentOnActivity',
        'handler':function(context) {
            var activity = context['activity'];
            var comment = context['comment'];
            return comments.commentOnActivity( activity, comment);
        },
        'description' : 'Framework handler'
    },
    {
        'event':'commentOnActivityByExternalID',
        'handler':function(context) {
            var extstream = context['extstream'];
            var externalActivityID = context['externalActivityID'];
            var comment = context['comment'];
            return comments.commentOnActivityByExternalID( extstream, externalActivityID, comment );
        },
        'description' : 'Framework handler'
    },
    {
        'event':'fetchCommentsOnActivity',
        'handler':function(context) {
            var activity = context['activity'];
            var opts = context['opts'];
            return comments.fetchCommentsOnActivity( activity, opts );
        },
        'description' : 'Framework handler'
    },
    {
        'event':'fetchAllCommentsForExtstream',
        'handler':function(context) {
            var extstream = context['extstream'];
            var opts = context['opts'];
            return comments.fetchAllCommentsForExtstream( extstream, opts );
        },
        'description' : 'Framework handler'
    },
    {
        'event':'registration',
        'handler':function(context) {
            return regHandler.registration(context);
        }
    },
    {
        'event':'clientAppRegistration',
        'handler':function(context) {
            return jive.community.register(context);
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'getPaginatedResults',
        'handler':function(context) {
            return pusher.getPaginated( context['extstream'], context['commentsURL'] );
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'getExternalProps',
        'handler':function(context) {
            return pusher.fetchExtendedProperties( context['instance'] );
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'setExternalProps',
        'handler':function(context) {
            return pusher.pushExtendedProperties( context['instance'], context['props'] );
        },
        'description' : 'Framework handler'
    },
    {
        'event': 'deleteExternalProps',
        'handler':function(context) {
            return pusher.removeExtendedProperties( context['instance'] );
        },
        'description' : 'Framework handler'
    }
];