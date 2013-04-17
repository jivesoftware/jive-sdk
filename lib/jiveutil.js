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
var q = require('q');
var fs = require('fs-extra');
var uuid = require('node-uuid');

exports.guid = function() {
    return uuid.v4();
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

var requestMaker = function (method, serverInfo, path, headers, body, secure, _requestParams ) {
    var requestParams = {
        host: serverInfo.host,
        port: serverInfo.port,
        method: method || 'GET',
        path: path,
        headers: headers || {}
    };

    if ( _requestParams  ) {
        for ( var key in _requestParams ) {
            if ( _requestParams.hasOwnProperty(key) ) {
                var val = _requestParams[key];
                requestParams[key] = val;
            }
        }
    }

    var postBody;

    if (method === 'POST' || method === 'PUT') {
        postBody = '';
        var contentType = headers['Content-Type'];
        var postObject = body;

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

        headers['Content-Length'] = Buffer.byteLength(postBody, 'utf8');
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

/**
 * @param url
 * @param method
 * @param postBody leave null unless PUT or POST
 * @param headers leave null or empty [] if no additional headers
 * @param requestParams leave null or empty [] if no additional request parameters
 * @return {*}
 */
exports.buildRequest = function(url, method, postBody, headers, requestParams ) {
    var urlParts = URL.parse(url, true);
    var path = urlParts.path;
    var host = urlParts.hostname;
    var port = urlParts.port;
    var protocol = urlParts.protocol;

    return requestMaker(
        method,
        { host: host, port: port },
        path,
        headers || {},
        postBody,
        protocol === 'https:',
        requestParams || {}
    );
};

exports.proxyJson =  function( handler ) {
    return function(response) {
        jsonResponseCallbackWrapper( response, handler )
    }
};

exports.makePromise = function(execute) {
    var deferred = q.defer();
    execute( function( results ) {
        deferred.resolve(results);
    });

    return deferred.promise;
};

exports.fsexists = function (path) {
    var deferred = q.defer();
    var method = fs.exists ? fs.exists : require('path').exists;
    method( path, function(exists ) {
        deferred.resolve(exists);
    });

    return deferred.promise;
};

exports.fscopy = function(source, target) {
    console.log('Copying',source,'to',target);
    var deferred = q.defer();

    fs.copy(source, target, function(err){
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return q.promise;
};

exports.mkdir = function(path) {
    var deferred = q.defer();

    fs.mkdirs( path, function(err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};

exports.fsread = function(path) {
    var deferred = q.defer();
    fs.readFile(path, function (err, data) {
        deferred.resolve(data);
        return data;
    });
    return deferred.promise;
};

exports.fswrite = function(data, path ) {
    var deferred = q.defer();

    fs.writeFile(path, data, function(err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};