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

/**
 * Definition event listeners are user contributed events.
 * @param event - the event id
 * @param definitionName - the name of the listener
 * @param handler - the function to call
 * @param description
 */
exports.addDefinitionEventListener = function( event, definitionName, handler, description ) {
    jive.logger.debug("Registered event for", definitionName,": '" + event + "' ", description ||'' );

    if ( !exports.eventHandlerMap[definitionName] ) {
        exports.eventHandlerMap[definitionName] = {};
    }

    if (!exports.eventHandlerMap[definitionName][event]) {
        exports.eventHandlerMap[definitionName][event] = [];
    }

    // duplicate definition event listeners aren't permitted
    if ( exports.eventHandlerMap[definitionName][event].indexOf(handler) == - 1 ) {
        exports.eventHandlerMap[definitionName][event].push( handler );
    }
};

exports.getDefinitionEventListenerFor = function( definitionName, event ) {
    if ( !exports.eventHandlerMap[definitionName] || !exports.eventHandlerMap[definitionName][event] ) {
        return null;
    }

    return exports.eventHandlerMap[definitionName][event];
};

/**
 * A System-level event listener, like the ones in the baseEvents array below.
 * @param event
 * @param handler
 * @param description
 */
exports.addSystemEventListener = function(event, handler, description) {
    jive.logger.debug("Registered system event ", event,": ", description || 'no description');

    if (!exports.eventHandlerMap[event]) {
        exports.eventHandlerMap[event] = [];
    }

    // duplicate system event listeners are permitted, tile-contributed
    // system event handlers
    exports.eventHandlerMap[event].push( handler );
};

exports.addLocalEventListener = function( event, handler ) {
    exports.addListener( event, handler );
};

/**
 * There are events that pusher nodes are allowed to handle.
 * @type {Array}
 */
exports.pushQueueEvents = [
    jive.constants.tileEventNames.PUSH_DATA_TO_JIVE,
    jive.constants.tileEventNames.PUSH_ACTIVITY_TO_JIVE,
    jive.constants.tileEventNames.PUSH_COMMENT_TO_JIVE
];

exports.globalEvents = [
    jive.constants.globalEventNames.NEW_INSTANCE,
    jive.constants.globalEventNames.INSTANCE_UPDATED,
    jive.constants.globalEventNames.INSTANCE_REMOVED,
    jive.constants.globalEventNames.DATA_PUSHED,
    jive.constants.globalEventNames.ACTIVITY_PUSHED,
    jive.constants.globalEventNames.COMMENT_PUSHED
];

/**
 * This is an array of system defined events
 * @type {Array}
 */
exports.baseEvents = [
    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(context){
            jive.logger.info("A new instance was created", context);
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : function(context){
            jive.logger.info("An instance was updated", context);
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.globalEventNames.INSTANCE_REMOVED,
        'handler' : function(context){
            jive.logger.info("Instance has been destroyed", context);
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.globalEventNames.DATA_PUSHED,
        'handler' : function(context){
            var theInstance = context['theInstance'], pushedData = context['pushedData'], response = context['response'];
            jive.logger.info('Data push to', theInstance.url, response ? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.globalEventNames.ACTIVITY_PUSHED,
        'handler' : function(context){
            var theInstance = context['theInstance'], pushedData = context['pushedData'], response = context['response'];
            jive.logger.info('Activity push to', theInstance.url, response ? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.globalEventNames.COMMENT_PUSHED,
        'handler' : function(context){
            var theInstance = context['theInstance'], pushedData = context['pushedData'], response = context['response'];
            jive.logger.info('Comment push to', theInstance.url, response ? response.statusCode : '', theInstance.name);
        },
        'description' : 'Framework handler'
    },

    {
        'event':jive.constants.tileEventNames.PUSH_DATA_TO_JIVE,
        'handler':function(context) {
            var tileInstance = context['tileInstance'];
            var data = context['data'];
            return pusher.pushData(tileInstance, data);
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.PUSH_ACTIVITY_TO_JIVE,
        'handler':function(context) {
            var tileInstance = context['tileInstance'];
            var activity = context['activity'];
            return pusher.pushActivity(tileInstance, activity);
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.PUSH_COMMENT_TO_JIVE,
        'handler':function(context) {
            var tileInstance = context['tileInstance'];
            var commentURL = context['commentsURL'];
            var comment = context['comment'];
            return pusher.pushComment(tileInstance, commentURL, comment);
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.COMMENT_ON_ACTIVITY,
        'handler':function(context) {
            var activity = context['activity'];
            var comment = context['comment'];
            return comments.commentOnActivity( activity, comment);
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.COMMENT_ON_ACTIVITY_BY_EXTERNAL_ID,
        'handler':function(context) {
            var extstream = context['extstream'];
            var externalActivityID = context['externalActivityID'];
            var comment = context['comment'];
            return comments.commentOnActivityByExternalID( extstream, externalActivityID, comment );
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.FETCH_COMMENTS_ON_ACTIVITY,
        'handler':function(context) {
            var activity = context['activity'];
            var opts = context['opts'];
            return comments.fetchCommentsOnActivity( activity, opts );
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.FETCH_ALL_COMMENTS_FOR_EXT_STREAM,
        'handler':function(context) {
            var extstream = context['extstream'];
            var opts = context['opts'];
            return comments.fetchAllCommentsForExtstream( extstream, opts );
        },
        'description' : 'Framework handler'
    },
    {
        'event':jive.constants.tileEventNames.INSTANCE_REGISTRATION,
        'handler':function(context) {
            return regHandler.registration(context);
        }
    },
    {
        'event':jive.constants.tileEventNames.CLIENT_APP_REGISTRATION,
        'handler':function(context) {
            return jive.community.register(context);
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.tileEventNames.GET_PAGINATED_RESULTS,
        'handler':function(context) {
            return pusher.getPaginated( context['extstream'], context['commentsURL'] );
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.tileEventNames.GET_EXTERNAL_PROPS,
        'handler':function(context) {
            return pusher.fetchExtendedProperties( context['instance'] );
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.tileEventNames.SET_EXTERNAL_PROPS,
        'handler':function(context) {
            return pusher.pushExtendedProperties( context['instance'], context['props'] );
        },
        'description' : 'Framework handler'
    },
    {
        'event': jive.constants.tileEventNames.DELETE_EXTERNAL_PROPS,
        'handler':function(context) {
            return pusher.removeExtendedProperties( context['instance'] );
        },
        'description' : 'Framework handler'
    }
];