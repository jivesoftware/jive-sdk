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
 * This is the jive network client.
 * @class jiveClient
 * @private
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var jive = require('../../api');
var util = require('util');
var constants = require('../util/constants');

var JIVE_OAUTH2_TOKEN_REQUEST_PATH = "/oauth2/token";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

/**
 * Utility for making generic GET request to Jive using auth header from tile instance. Attempts to resolve the promise
 * to the actual data in the response, not the response object. Has to strip out the security string from Jive.
 *
 * If this fails, returns the original response, so be careful to check if obj.statusCode exists in your callback.
 * @memberof jiveClient
 */
exports.getWithTileInstanceAuth = function (tileInstance, url) {
    return exports.tileFetch(tileInstance, url).then(function (response) {
        if (!response.entity || !response.entity.body) {
            return response;
        }

        var body = response.entity.body;

        try {
            response.entity = JSON.parse(body);
        }
        catch (e) {
            //Do nothing, was not valid JSON object so response.entity.body will contain body string
        }
        return response;
    });
};

/**
 * @memberof jiveClient
 * @param options
 * @param successCallback
 * @param failureCallback
 */
exports.requestAccessToken = function (options, successCallback, failureCallback) {
    var accessTokenRequest = {
        client_id: options['client_id'],
        code: options['code'],
        grant_type: 'authorization_code'
    };

    try {
        if (!options.jiveUrl) {
            throw new Error("Cannot request access token without a jiveUrl");
        } else {
            // otherwise we deal directly with jive
            var tokenRequestEndPoint = options.jiveUrl + JIVE_OAUTH2_TOKEN_REQUEST_PATH;
            var auth = "Basic " + new Buffer(accessTokenRequest.client_id + ':' + options.client_secret).toString('base64');
            var headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": auth
            };

            jive.util.buildRequest(tokenRequestEndPoint, "POST", accessTokenRequest, headers)
                .then(successCallback, failureCallback);
        }
    }
    catch (e) {
        if (failureCallback) {
            failureCallback(e);
        }
        else {
            jive.logger.error("Error requesting access token!", e);
        }
    }
};

/**
 * @memberof jiveClient
 * @param options
 * @param successCallback
 * @param failureCallback
 */
exports.refreshAccessToken = function (options, successCallback, failureCallback) {
    var accessTokenRequest = {
        client_id: options['client_id'],
        refresh_token: options['refresh_token'],
        grant_type: 'refresh_token'
    };

    try {
        if (!options.jiveUrl) {
            throw new Error("Cannot refresh token without a jiveUrl");
        } else {
            // otherwise we deal directly with jive
            var tokenRequestEndPoint = options.jiveUrl + JIVE_OAUTH2_TOKEN_REQUEST_PATH;
            var auth = "Basic " + new Buffer(accessTokenRequest.client_id + ':' + options.client_secret).toString('base64');
            var headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": auth
            };

            jive.util.buildRequest(tokenRequestEndPoint, "POST", accessTokenRequest, headers)
                .then(successCallback, failureCallback);
        }
    }
    catch (e) {
        if (failureCallback) {
            failureCallback(e);
        }
        else {
            jive.logger.error("Error requesting refresh token!", e);
        }
    }
};

/**
 * @memberof jiveClient
 * @param tileInstance
 * @param data
 * @returns {*}
 */
exports.pushData = function (tileInstance, data) {
    return tilePush('PUT', tileInstance, data, tileInstance['url']);
};

/**
 * @memberof jiveClient
 * @param tileInstance
 * @param activity
 * @returns {*}
 */
exports.pushActivity = function (tileInstance, activity) {
    return tilePush('POST', tileInstance, activity, tileInstance['url']);
};
/**
 * @memberof jiveClient
 * @param instance
 * @returns {*}
 */
exports.fetchActivityByExternalID = function (instance, externalActivityId) {
    return jive.util.buildRequest(extractFetchActivityByExternalIDUrl(instance, externalActivityId),
        'GET', null, makeExternalPropsHeader(instance));
};
/**
 * @memberof jiveClient
 * @param instance
 * @returns {*}
 */
exports.fetchActivityByExternalID = function (instance) {
    return jive.util.buildRequest(extractExternalPropsUrl(instance),
        'GET', null, makeExternalPropsHeader(instance));
};
/**
 * @memberof jiveClient
 * @param tileInstance
 * @param activity
 * @returns {*}
 */
exports.updateActivity = function (tileInstance, activity) {
    var url = activity['url'];
    return tilePush('PUT', tileInstance, activity, url);
};

/**
 * @memberof jiveClient
 * @param tileInstance
 * @param comment
 * @param commentURL
 * @returns {*}
 */
exports.pushComment = function (tileInstance, comment, commentURL) {
    return tilePush('POST', tileInstance, comment, commentURL);
};

/**
 * @memberof jiveClient
 * @param instance
 * @returns {*}
 */
exports.fetchExtendedProperties = function (instance) {
    return jive.util.buildRequest(extractExternalPropsUrl(instance),
        'GET', null, makeExternalPropsHeader(instance));
};

/**
 * @memberof jiveClient
 * @param instance
 * @param props
 * @returns {*}
 */
exports.pushExtendedProperties = function (instance, props) {
    return jive.util.buildRequest(extractExternalPropsUrl(instance),
        'POST', props, makeExternalPropsHeader(instance));
};

/**
 * @memberof jiveClient
 * @param instance
 * @returns {*}
 */
exports.removeExtendedProperties = function (instance) {
    return jive.util.buildRequest(extractExternalPropsUrl(instance),
        'DELETE', null, makeExternalPropsHeader(instance));
};

/**
 * @memberof jiveClient
 * @param tileInstance
 * @param fetchURL
 * @returns {*}
 */
exports.tileFetch = function (tileInstance, fetchURL) {
    var auth = 'Bearer ' + tileInstance['accessToken'];
    var reqHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth
    };

    return jive.util.buildRequest(fetchURL, 'GET', null, reqHeaders);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var tilePush = function (method, tileInstance, data, pushURL) {
    var auth = 'Bearer ' + tileInstance['accessToken'];
    var reqHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth
    };

    if (data && !data['status']) {
        // add an empty status object if it doesn't exist
        data['status'] = {};
    }

    return jive.util.buildRequest(pushURL, method, data, reqHeaders);
};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var extractExternalPropsUrl = function (instance) {
    var instanceURL = instance['url'];
    if (endsWith(instanceURL, '/data')) {
        return instanceURL.match(/(.+)\/data/)[1] + '/extprops';
    }
    if (endsWith(instanceURL, '/activities')) {
        return instanceURL.match(/(.+)\/activities/)[1] + '/extprops';
    }

    throw new Error('Could not extract external props url from instance');
};

var extractFetchActivityByExternalIDUrl = function (instance, extActivtiyID) {
    var instanceURL = instance['url'];
    if (endsWith(instanceURL, '/activities')) {
        var result = instanceURL.match(/(.+)\/activities/)[1] + '/extactivities/' + extActivtiyID;
        return result;
    }

    throw new Error('Could not extract external props url from instance');

};

var makeExternalPropsHeader = function (instance) {
    var auth = 'Bearer ' + instance['accessToken'];
    return {'X-Client-Id': jive.context.config['clientId'], 'Authorization': auth};
};

