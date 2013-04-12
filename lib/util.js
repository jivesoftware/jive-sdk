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

var URL = require('url');
var http = require('http');
var https = require('https');

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

exports.guid = function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

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

var requestMaker = function (method, serverInfo, path, params, secure) {
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
            var protocolHandler = secure ? https : http;
            var request = protocolHandler.request(requestParams, function(response) {
                jsonResponseCallbackWrapper(response, successCallback);
            });

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

exports.buildRequest = function(url, method, postBody, headers ) {
    var urlParts = URL.parse(url, true);
    var path = urlParts.path;
    var host = urlParts.host;
    var port = urlParts.port;
    var protocol = urlParts.protocol;

    var requestParams = {
        headers : headers,
        postBody: postBody
    };

    return requestMaker(method, { host: host, port: port }, path, requestParams, protocol === 'https:' );
};

exports.proxyJson =  function( handler ) {
    return function(response) {
        jsonResponseCallbackWrapper( response, handler )
    }
};