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
 * This is the network client
 */

var http = require('http');
var url = require('url');

var configuration = {
    "jiveid": {
        "servers": {
            "ui": {
                "host": "jive-id-my.eng.jiveland.com",
                "port": 40000
            },
            "public": {
                "host": "jive-id-my.eng.jiveland.com",
                "port": 42000
            },
            "batphone": {
                "host": "jive-id-batphone.eng.jiveland.com",
                "port": 41000
            }
        }
    }
};

var jiveIDEndpointProvider = function () {

    var requestMaker = function (method, server, path, params) {
        var serverInfo = configuration.jiveid.servers[server];
        var requestParams = {
            host: serverInfo.host,
            port: serverInfo.port,
            method: method || 'GET',
            path: path,
            headers: params ? params['headers'] : {}
        };

        var postBody;

        if (method === 'POST' || method === 'PUT') {
            postBody = '';
            var contentType = params.headers['Content-Type'];
            var postObject = params['postObject'];

            if (contentType === 'application/json') {
                postBody = JSON.stringify(postObject);
            } else {
                for (var key in postObject) {
                    if (postObject.hasOwnProperty(key)) {
                        if (postBody.length > 0) {
                            postBody += '&';
                        }
                        postBody += encodeURIComponent(key) + '=' + encodeURIComponent(postObject[key]);
                    }
                }
            }

            requestParams['headers']['Content-Length'] = Buffer.byteLength(postBody, 'utf8');
        }

        return {
            execute: function (successCallback, errCallback) {
                var request = http.request(requestParams, successCallback);

                if (postBody) {
                    request.write(postBody);
                }
                request.end();

                request.on('error', function (e) {
                    console.log(e);
                    if (errCallback) {
                        errCallback(e);
                    }
                });
            }
        }
    };

    return {
        login: function (userEmail, userPassword, callbackURL) {
            return requestMaker("POST", "ui", "/login", {
                "postObject": {
                    "email": userEmail,
                    "password": userPassword,
                    "successUrl": callbackURL
                },
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
        },

        applicationCreate: function (cookie, appName, appDescription) {
            return requestMaker("GET", "ui", "/v1/oauth2/application/create?name=" + appName + "&description=" + appDescription, {
                "headers": {
                    "Cookie": cookie
                }
            });
        },

        applicationRetrieve: function (clientId) {
            return requestMaker("GET", "batphone", "/v1/oauth2/application/" + clientId);
        },

        requestAccessToken: function (accessTokenRequest) {
            return requestMaker("POST", "public", "/v1/oauth2/token", {
                "postObject": accessTokenRequest,
                "headers": {
                    "Content-Type": "application/json"
                }
            });
        }
    }
}();

var jsonResponseCallbackWrapper = function (response, callback) {
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        var entity = JSON.parse(str);
        callback(entity)
    });

};

/**
 * Override the default client configuration here, eg. the jiveID server locations
 * @param _options
 */
exports.init = function( _configuration ) {
    configuration = _configuration;
};

/**
 * Return current client configuration
 * @return configuration JSON
 **/
exports.options = function() {
    return configuration;
} ;

exports.Application = {

    register: function (options, successCallback, failureCallback) {
        var appName = options['appName'] || 'app_' + new Date().getTime();
        var appDescription = options['appDescription'] || appName;

        var loginRequest = jiveIDEndpointProvider.login(
            options['userEmail'],
            options['userPassword'],
            options['callbackURL']
        );

        var loginCallback = function (response) {
            var str = '';

            // for debugging
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                console.log(str);
            });

            var cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
            var createAppRequest = jiveIDEndpointProvider.applicationCreate(
                cookie ? cookie[0] : null, appName, appDescription
            );

            createAppRequest.execute(function (response) {
                jsonResponseCallbackWrapper(response, successCallback);
            }, failureCallback);
        };

        loginRequest.execute(loginCallback);
    },

    retrieve: function (clientId, successCallback, failureCallback) {
        var request = jiveIDEndpointProvider.applicationRetrieve(clientId);
        request.execute(function (response) {
            jsonResponseCallbackWrapper(response, successCallback);
        }, failureCallback);
    }

};

var tilePush = function (method, tileInstance, data) {

    return {
        execute: function (callback) {
            var auth = 'Bearer ' + tileInstance['accessToken'];
            var urlObject = url.parse(tileInstance['url']);

            var reqHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': auth
            };

            var options = {
                hostname: urlObject.hostname,
                port: urlObject.port,
                path: urlObject.path,
                method: method,
                headers: reqHeaders
            };

            var req = http.request(options, callback);
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });

            // write data to request body
            req.write(JSON.stringify(data));
            req.end();
        }
    };
};

exports.TileInstance = {
    register: function (options, successCallback, failureCallback) {
        var accessTokenRequest = {
            client_id: options['client_id'],
            code: options['code'],
            grant_type: 'authorization_code'
        };

        var request = jiveIDEndpointProvider.requestAccessToken(accessTokenRequest);
        request.execute(function (response) {
            jsonResponseCallbackWrapper(response, successCallback);
        }, failureCallback);
    },

    refreshAccessToken: function (options, successCallback, failureCallback) {
        var accessTokenRequest = {
            client_id: options['client_id'],
            refresh_token: options['refresh_token'],
            grant_type: 'refresh_token'
        };

        var request = jiveIDEndpointProvider.requestAccessToken(accessTokenRequest);
        request.execute(function (response) {
            jsonResponseCallbackWrapper(response, successCallback);
        }, failureCallback);
    },

    pushData: function (tileInstance, data) {
        return tilePush('PUT', tileInstance, data);
    },

    pushActivity: function (tileInstance, activity) {
        return tilePush('POST', tileInstance, activity);
    }

};

