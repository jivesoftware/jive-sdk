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
 * API for managing events. Use this to register event handlers for the various types of events emitted by the system,
 * and also for definining your custom events and handlers. @see {@link module:constants} for a list of emitted system events.
 * @module events
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var events = require('events');
var jive = require('../../api');
var pusher = require('../tile/dataPusher');
var comments = require('../tile/comments');
var regHandler = require('../tile/registration.js');


function addTargetedEventListener(eventListener, event, description, handler) {
    jive.logger.debug("Registered event for", eventListener, ": '" + event + "' ", description || '');

    if (!exports.eventHandlerMap[eventListener]) {
        exports.eventHandlerMap[eventListener] = {};
    }

    if (!exports.eventHandlerMap[eventListener][event]) {
        exports.eventHandlerMap[eventListener][event] = [];
    }

    // duplicate definition event listeners aren't permitted
    if (exports.eventHandlerMap[eventListener][event].indexOf(handler) == -1) {
        exports.eventHandlerMap[eventListener][event].push(handler);
    } else {
        jive.logger.warn("Event", event, "eventListener", eventListener, "already exists; ignoring event listener add.");
    }
}


function addUntargetedEventListener(event, description, handler) {
    jive.logger.debug("Registered system event ", event, ": ", description || 'no description');

    if (!exports.eventHandlerMap[event]) {
        exports.eventHandlerMap[event] = [];
    }

    // duplicate system event listeners are permitted, tile-contributed
    // system event handlers
    exports.eventHandlerMap[event].push(handler);
}

///////////////////////////////////////////////////////////////////////////////////
// public

exports = module.exports = new events.EventEmitter();

exports.eventHandlerMap = {};

/**
 * Add an event handler. The handler is invoked when an event is fired which
 * specifies the target event listener and event type, if both are specified in the event firing.
 * If only event is specified, then the handler will be invoked whenever that event is fired.
 * <br><br>
 * The handler is added to an array of handler functions assigned for the
 * event listener. Only one function per event listener per event is permitted.
 * @param {String} event - the event id
 * @param {function} handler - the function to call
 * @param {object} options
 * @param {String} options.eventListener the name of the listener
 * @param {String} options.description
 *
 */
exports.registerEventListener = function( event, handler, options) {
    if ( !event ) {
        throw new Error("Must specify a target event.");
    }

    if ( !handler ) {
        throw new Error("Must specify an event handler function.");
    }

    if ( typeof handler !== 'function' ) {
        throw new Error("Event handler must be a function.");
    }

    var targetListener;
    var description;

    if ( options ) {
        targetListener = options['eventListener'];
        description = options['description'];
    }

    if ( targetListener ) {
        addTargetedEventListener(targetListener, event, description, handler);
    } else {
        addUntargetedEventListener(event, description, handler );
    }
};

/**
 * Returns array of registered event handling functions for the given event listener and event.
 * Otherwise returns undefined.
 * @param {String} event
 * @param {String} eventListener
 * @returns {Array}
 */
exports.getEventListeners = function(event, eventListener) {
    if ( eventListener && event ) {
        if ( !exports.eventHandlerMap[eventListener] || !exports.eventHandlerMap[eventListener][event] ) {
            return null;
        }

        return exports.eventHandlerMap[eventListener][event];
    } else {
        if ( eventListener && !event ) {
            var events = exports.eventHandlerMap[eventListener];
            if ( !events ) {
                return null;
            }

            if ( events['indexOf'] ) {
                return events;
            }

            var handlers = [];
            for (var key in events) {
                if (events.hasOwnProperty(key)) {
                    handlers.push(events[key]);
                }
            }

            return handlers;
        } else if ( !eventListener && event ) {
            var events = exports.eventHandlerMap;
            var handlers = [];

            for (var key in events) {
                if (events.hasOwnProperty(key)) {
                    var listeners = events[key];
                    if ( listeners && !listeners['indexOf'] ) {
                        var handler = listeners[event];
                        if ( handler ) {
                            handlers.push(handler)
                        }
                    }
                }
            }

            return handlers;
        } else {
            return null;
        }
    }
};

/**
 * Adds a local event handler.
 * @param {String} event
 * @param {function} handler
 */
exports.addLocalEventListener = function( event, handler ) {
    exports.addListener( event, function(context) {
        return handler(context, event);
    } );
};

/**
 * There are events that pusher nodes are allowed to handle.  See {@link module:constants.tileEventNames}.
 * @private
 * @property {String} PUSH_DATA_TO_JIVE Fired on request to push tile data update to Jive.
 * @property {String} PUSH_ACTIVITY_TO_JIVE Fired on request to push externatstream activity to Jive.
 * @property {String} PUSH_COMMENT_TO_JIVE Fired on request to push a comment into Jive.
 */
exports.pushQueueEvents = [
    jive.constants.tileEventNames.PUSH_DATA_TO_JIVE,
    jive.constants.tileEventNames.PUSH_ACTIVITY_TO_JIVE,
    jive.constants.tileEventNames.PUSH_COMMENT_TO_JIVE
];

/**
 * Array of system defined events. See {@link module:constants.globalEventNames}.
 * @private
 * @property {String} NEW_INSTANCE Fired when a new tile or externalstream instance is created.
 * @property {String} INSTANCE_UPDATED Fired when a tile or externalstream instance is updated.
 * @property {String} INSTANCE_REMOVED Fired when a tile or externalstream instance is destroyed.
 * @property {String} DATA_PUSHED Fired when a tile instance updated is pushed into Jive.
 * @property {String} ACTIVITY_PUSHED Fired when an externalstream instance is pushed into Jive.
 * @property {String} COMMENT_PUSHED Fired when an externalstream instance comment is pushed into Jive.
 * @property {String} CLIENT_APP_REGISTRATION_SUCCESS Fired when a community registers itself with the addon service successfully.
 * @property {String} CLIENT_APP_REGISTRATION_FAILED Fired when a community registers itself with the addon service unsuccessfully.
 */
exports.globalEvents = [
    jive.constants.globalEventNames.NEW_INSTANCE,
    jive.constants.globalEventNames.INSTANCE_UPDATED,
    jive.constants.globalEventNames.INSTANCE_REMOVED,
    jive.constants.globalEventNames.DATA_PUSHED,
    jive.constants.globalEventNames.ACTIVITY_PUSHED,
    jive.constants.globalEventNames.COMMENT_PUSHED,
    jive.constants.globalEventNames.CLIENT_APP_REGISTRATION_SUCCESS,
    jive.constants.globalEventNames.CLIENT_APP_REGISTRATION_FAILED
];

/**
 * This is a map of system defined events to their respective event handlers.
 * @property {Object} NEW_INSTANCE Fired on request to push tile data update to Jive.
 * @property {function} NEW_INSTANCE.handler Logs the request context
 * @property {Object} INSTANCE_UPDATED Fired on request to push tile data update to Jive.
 * @property {function} INSTANCE_UPDATED.handler Logs the request context
 * @property {Object} INSTANCE_REMOVED Fired on request to push tile data update to Jive.
 * @property {function} INSTANCE_REMOVED.handler Logs the request context
 * @property {Object} PUSH_DATA_TO_JIVE Fired on request to push tile data update to Jive.
 * @property {function} PUSH_DATA_TO_JIVE.handler Passed <b>context</b> contains <i>theInstance</i> and <i>data</i> attributes. These are used
 * to push a tile update into Jive.
 * @property {Object} PUSH_ACTIVITY_TO_JIVE Fired on request to push externatstream activity to Jive.
 * @property {function} PUSH_ACTIVITY_TO_JIVE.handler Passed <b>context</b> contains <i>theInstance</i> and <i>activity</i> attributes. These are used
 * to push an extstreamstream activity entry into Jive.
 * @property {Object} PUSH_COMMENT_TO_JIVE Fired on request to push a comment into Jive.
 * @property {function} PUSH_COMMENT_TO_JIVE.handler Logs the request context
 * @property {Object} COMMENT_ON_ACTIVITY Fired on request to push a comment on an activity entry into Jive.
 * @property {function} COMMENT_ON_ACTIVITY.handler
 * @property {Object} COMMENT_ON_ACTIVITY_BY_EXTERNAL_ID Fired on request to push a comment on an activity entry into Jive.
 * @property {function} COMMENT_ON_ACTIVITY_BY_EXTERNAL_ID.handler
 * @property {Object} FETCH_COMMENTS_ON_ACTIVITY  Fired on request for activity comments from Jive.
 * @property {function} FETCH_COMMENTS_ON_ACTIVITY.handler
 * @property {Object} FETCH_ALL_COMMENTS_FOR_EXT_STREAM Fired on request for activity comments from Jive.
 * @property {function} FETCH_ALL_COMMENTS_FOR_EXT_STREAM.handler
 * @property {Object} INSTANCE_REGISTRATION Fired on request to register a new tile or externalstream instance.
 * @property {function} INSTANCE_REGISTRATION.handler
 * @property {Object} INSTANCE_UNREGISTRATION Fired on request to destroy a tile or externalstream instance.
 * @property {function} INSTANCE_UNREGISTRATION.handler
 * @property {Object} CLIENT_APP_REGISTRATION Fired on request to register a Jive instance on the service.
 * @property {function} CLIENT_APP_REGISTRATION.handler
 * @property {Object} CLIENT_APP_UNREGISTRATION Fired on request to unregister a Jive instance on the service.
 * @property {function} CLIENT_APP_UNREGISTRATION.handler
 * @property {Object} GET_PAGINATED_RESULTS Fired on request for paginated results from a Jive service.
 * @property {function} GET_PAGINATED_RESULTS.handler
 * @property {Object} GET_EXTERNAL_PROPS Fired on request for retrieving external props on a tile or externalstream instance.
 * @property {function} GET_EXTERNAL_PROPS.handler
 * @property {Object} SET_EXTERNAL_PROPS Fired on request for setting external props on a tile or externalstream instance.
 * @property {function} SET_EXTERNAL_PROPS.handler
 * @property {Object} DELETE_EXTERNAL_PROPS  Fired on request for deleting external props on a tile or externalstream instance.
 * @property {function} DELETE_EXTERNAL_PROPS.handler
 */
exports.systemEvents = [
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
        'event':jive.constants.tileEventNames.INSTANCE_UNREGISTRATION,
        'handler':function(context) {
            return regHandler.unregistration(context);
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
        'event':jive.constants.tileEventNames.CLIENT_APP_UNREGISTRATION,
        'handler':function(context) {
            return jive.community.unregister(context);
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

/**
 * Removes all event handlers.
 */
exports.reset = function() {
    exports.eventHandlerMap = {};
    exports.removeAllListeners();
};
