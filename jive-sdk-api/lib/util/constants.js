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
 * @module constants
 */

/**
 * @property {String} PUSH_DATA_TO_JIVE <b>pushDataToJive</b> Fired on request to push tile data update to Jive.
 * @property {String} PUSH_ACTIVITY_TO_JIVE Fired on request to push externatstream activity to Jive.
 * @property {String} PUSH_COMMENT_TO_JIVE Fired on request to push a comment into Jive.
 * @property {String} COMMENT_ON_ACTIVITY Fired on request to push a comment on an activity entry into Jive.
 * @property {String} COMMENT_ON_ACTIVITY_BY_EXTERNAL_ID Fired on request to push a comment on an activity entry into Jive.
 * @property {String} FETCH_COMMENTS_ON_ACTIVITY Fired on request for activity comments from Jive.
 * @property {String} FETCH_ALL_COMMENTS_FOR_EXT_STREAM Fired on request for activity comments from Jive.
 * @property {String} INSTANCE_REGISTRATION Fired on request to register a new tile or externalstream instance.
 * @property {String} INSTANCE_UNREGISTRATION Fired on request to destroy a tile or externalstream instance.
 * @property {String} CLIENT_APP_REGISTRATION Fired on request to register a Jive instance on the service.
 * @property {String} CLIENT_APP_UNREGISTRATION Fired on request to unregister a Jive instance on the service.
 * @property {String} GET_PAGINATED_RESULTS Fired on request for paginated results from a Jive service.
 * @property {String} GET_EXTERNAL_PROPS Fired on request for retrieving external props on a tile or externalstream instance.
 * @property {String} SET_EXTERNAL_PROPS Fired on request for setting external props on a tile or externalstream instance.
 * @property {String} DELETE_EXTERNAL_PROPS  Fired on request for deleting external props on a tile or externalstream instance.
 */
exports.tileEventNames = {
    'PUSH_DATA_TO_JIVE':'pushDataToJive',
    'PUSH_ACTIVITY_TO_JIVE':'pushActivityToJive',
    'PUSH_COMMENT_TO_JIVE':'pushCommentToJive',
    'COMMENT_ON_ACTIVITY':'commentOnActivity',
    'COMMENT_ON_ACTIVITY_BY_EXTERNAL_ID':'commentOnActivityByExternalID',
    'FETCH_COMMENTS_ON_ACTIVITY':'fetchCommentsOnActivity',
    'FETCH_ALL_COMMENTS_FOR_EXT_STREAM':'fetchAllCommentsForExtstream',
    'INSTANCE_REGISTRATION':'registration',
    'INSTANCE_UNREGISTRATION':'unregistration',
    'CLIENT_APP_REGISTRATION':'clientAppRegistration',
    'CLIENT_APP_UNREGISTRATION':'clientAppUnregistration',
    'GET_PAGINATED_RESULTS':'getPaginatedResults',
    'GET_EXTERNAL_PROPS':'getExternalProps',
    'SET_EXTERNAL_PROPS':'setExternalProps',
    'DELETE_EXTERNAL_PROPS':'deleteExternalProps'
};

/**
 * @property {String} NEW_INSTANCE Fired when a new tile or externalstream instance is created.
 * @property {String} INSTANCE_UPDATED Fired when a tile or externalstream instance is updated.
 * @property {String} INSTANCE_REMOVED Fired when a tile or externalstream instance is destroyed.
 * @property {String} DATA_PUSHED Fired when a tile instance updated is pushed into Jive.
 * @property {String} ACTIVITY_PUSHED Fired when an externalstream instance is pushed into Jive.
 * @property {String} COMMENT_PUSHED Fired when an externalstream instance comment is pushed into Jive.
 * @property {String} CLIENT_APP_REGISTRATION_SUCCESS Fired when a community registers itself with the addon service successfully.
 * @property {String} CLIENT_APP_REGISTRATION_FAILED Fired when a community registers itself with the addon service unsuccessfully.
 * @property {String} CLIENT_APP_UNREGISTRATION_SUCCESS Fired when a community unregisters itself with the addon service successfully.
 * @property {String} CLIENT_APP_UNREGISTRATION_FAILED Fired when a community unregisters itself with the addon service unsuccessfully.
 */
exports.globalEventNames = {
    'NEW_INSTANCE':'newInstance',
    'INSTANCE_UPDATED':'updateInstance',
    'INSTANCE_REMOVED':'destroyedInstance',
    'DATA_PUSHED':'dataPushed',
    'ACTIVITY_PUSHED':'activityPushed',
    'COMMENT_PUSHED':'commentPushed',
    'CLIENT_APP_REGISTRATION_SUCCESS' : 'registeredJiveInstanceSuccess',
    'CLIENT_APP_REGISTRATION_FAILED' : 'registeredJiveInstanceFailed',
    'CLIENT_APP_UNREGISTRATION_SUCCESS' : 'unregisterJiveInstanceSuccess',
    'CLIENT_APP_UNREGISTRATION_FAILED' : 'unregisterJiveInstanceFailed'
};

/**
 * @property {String} WORKER Worker nodes typically do not handle HTTP requests, and are concerned mostly with background tasks.
 * @property {String} PUSHER A subspecies of WORKER node, specializing in making HTTP requests.
 * @property {String} HTTP_HANDLER HTTP handler nodes specialize in accepting incoming requests, and possibly forwarding them for further processing.
 */
exports.roles = {
    'WORKER':'worker',
    'PUSHER':'pusher',
    'HTTP_HANDLER':'http'
};

/**
 * This is the string normally appended to incoming v3 entities, for the purpose of thwarting security threats: <br>
 *     throw 'allowIllegalResourceCall is false.';
 * @type {string}
 */
exports.SECURITY_STRING = "throw 'allowIllegalResourceCall is false.';\n";