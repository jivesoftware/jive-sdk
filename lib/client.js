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
 * This is the network client. You may override specific servers by setting
 * environment variables, for example:
 *
 * jive.jiveid.servers.public=http://myjive:4000
 *
 * This will configure the client to use a different endpoint for Jive ID public.
 */

var http = require('http');
var url = require('url');
var jive = require('../api');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

var configuration = {
    "jiveid": {
        "servers": {
            "public": "https://jive-id-public.prod.jivehosted.com:42443"
        }
    }
};

var requestMaker = function (method, server, path, params) {
    var override = process.env['jive.jiveid.servers.' + server];
    var serverUrl = override || configuration['jiveId']['servers'][server];
    var url = serverUrl + path;

    return jive.util.buildRequest(url, method, params['postObject'], params['headers'] );
};

var jiveIDEndpointProvider = {

    requestAccessToken: function (accessTokenRequest) {
        return requestMaker("POST", "public", "/v1/oauth2/token", {
            "postObject": accessTokenRequest,
            "headers": {
                "Content-Type": "application/json"
            }
        });
    }
};

var tilePush = function (method, tileInstance, data, pushURL ) {
    var auth = 'Bearer ' + tileInstance['accessToken'];
    var reqHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': auth
    };

    return jive.util.buildRequest(pushURL, method, data, reqHeaders );
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

exports.requestAccessToken = function (options, successCallback, failureCallback) {
    var accessTokenRequest = {
        client_id: options['client_id'],
        code: options['code'],
        grant_type: 'authorization_code'
    };

    var request = jiveIDEndpointProvider.requestAccessToken(accessTokenRequest);
    request.execute(successCallback, failureCallback);
};

exports.refreshAccessToken = function (options, successCallback, failureCallback) {
    var accessTokenRequest = {
        client_id: options['client_id'],
        refresh_token: options['refresh_token'],
        grant_type: 'refresh_token'
    };

    var request = jiveIDEndpointProvider.requestAccessToken(accessTokenRequest);
    request.execute(successCallback, failureCallback);
};

exports.pushData = function (tileInstance, data) {
    return tilePush('PUT', tileInstance, data, tileInstance['url']);
};

exports.pushActivity = function (tileInstance, activity) {
    return tilePush('POST', tileInstance, activity, tileInstance['url']);
};

exports.pushComment = function( tileInstance, comment, commentURL ) {
    return tilePush('POST', tileInstance, comment, commentURL );
};

