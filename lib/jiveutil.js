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
var request = require('request');
var q = require('q');
var fs = require('fs-extra');
var uuid = require('node-uuid');

exports.guid = function() {
    return uuid.v4();
};

var jsonResponseCallbackWrapper = function (response, body, callback) {
    var responseHeaders = response['headers'];
    var statusCode = response['statusCode'];

    var resp = {
        'statusCode' : statusCode,
        'headers' : responseHeaders
    };

    if ( body && body.length > 0 ) {
        try {
            var entity = JSON.parse(body);
            resp['entity'] = entity;
        } catch( e ) {
           console.log('Error parsing response!', e );
           if (statusCode >= 400 && statusCode <= 599) {
               resp['entity'] = {status: statusCode, error: body }
           }
        }
    }

    callback(resp);
};

var requestMaker = function (method, serverInfo, path, headers, body, secure, requestOptions ) {

    if (typeof body === 'undefined') {
        body = '';
    }

    // these are used in the http or https .request
    var options = {
        host: serverInfo.host,
        port: serverInfo.port,
        method: method || 'GET',
        path: path,
        headers: headers || {}
    };

    if ( requestOptions  ) {
        for ( var key in requestOptions ) {
            if ( requestOptions.hasOwnProperty(key) ) {
                options[key] = requestOptions[key];
            }
        }
    }

    var postBodyStr;

    if (method === 'POST' || method === 'PUT') {
        postBodyStr = '';
        var contentType = headers['Content-Type'];


        if ( contentType === 'application/json') {
            if ( typeof body === 'object' ) {
                postBodyStr = JSON.stringify(body);
            } else if (typeof body === 'string' ) {
                postBodyStr = body;
            } else {
                throw "Illegal type of post body; only object or string is permitted.";
            }
        } else {
            var postObject;
            if ( typeof body === 'string' ) {
                postObject = JSON.parse( body );
            } else if ( typeof body !== 'object' ) {
                throw "Illegal type of post body; only object or string is permitted.";
            } else {
                postObject = body;
            }

            for (var key in postObject) {
                if (postObject.hasOwnProperty(key)) {
                    if (postBodyStr.length > 0) {
                        postBodyStr += '&';
                    }
                    postBodyStr += encodeURIComponent(key) + '=' + encodeURIComponent(postObject[key]);
                }
            }
        }

        headers['Content-Length'] = Buffer.byteLength(postBodyStr, 'utf8');
    }

    return {
        execute: function (successCallback, errCallback) {
            var request = require('request');
            var url = ( secure ? 'https' : 'http') + '://' +
                      options['host'] +
                     ( options['port'] ? ':' + options['port'] : '' ) +
                      options['path']
                      ;
            options['url'] = url;
            if ( postBodyStr ) {
                options['body'] = postBodyStr;
            }

            delete options['host'];
            delete options['path'];

            request(options, function (error, response, body) {
                if (!error) {
                    jsonResponseCallbackWrapper(response, body, successCallback );
                } else {
                    errCallback(error || body);
                }
            });
        }
    }
};

/**
 * By default this will build a request of type 'application/json'. Set a Content-Type header
 * explicitly if its supposed to be a different type.
 * @param url
 * @param method
 * @param postBody leave null unless PUT or POST
 * @param headers leave null or empty [] if no additional headers
 * @param requestOptions leave null or empty [] if no additional request optinos
 * @return {*}
 */
exports.buildRequest = function(url, method, postBody, headers, requestOptions ) {
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
        protocol && protocol.indexOf( 'https' ) == 0,
        requestOptions || {}
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

exports.fsmkdir = function(path) {
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

exports.base64Encode = function( object ) {
    return new Buffer( JSON.stringify( object) ).toString('base64');
};

exports.base64Decode = function( str ) {
    return new Buffer(str, 'base64').toString('ascii');;
};
