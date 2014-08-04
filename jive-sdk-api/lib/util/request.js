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
 * Library of methods for making requests.
 * @module request
 * @abstract
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var URL = require('url');
var request = require('request');
var q = require('q');
var jive = require('../../api');
var constants = require("./constants");
var zlib = require('zlib');

/**
 * By default this will build a request of type 'application/json'. Set a Content-Type header
 * explicitly if its supposed to be a different type.
 * @param {String} url
 * @param {String} method
 * @param {Object} postBody leave null unless PUT or POST
 * @param {Object} headers leave null or empty [] if no additional headers
 * @param {Object} requestOptions leave null or empty [] if no additional request optinos
 * @return {Promise} Promise
 */
exports.buildRequest = function (url, method, postBody, headers, requestOptions) {
    var urlParts = URL.parse(url, true);
    var path = urlParts.path;
    var host = urlParts.hostname;
    var port = urlParts.port;
    var protocol = urlParts.protocol;

    var deferred = q.defer();

    requestOptions = requestOptions || {};
    if ( jive.context && jive.context.config ) {
        if (jive.context.config['development'] == true || jive.context.config['strictSSL'] === false) {
            requestOptions['rejectUnauthorized']  = false;
        }
    }

    requestOptions['jar'] = false;

    requestMaker(
        method,
        { host: host, port: port },
        path,
        headers || {},
        postBody,
        protocol && protocol.indexOf('https') == 0,
        requestOptions || {}
    ).execute(
        // success
        function (response) {
            deferred.resolve(response);
        },

        // failure
        function (response) {
            deferred.reject(response);
        }
    );

    return deferred.promise;
};

var jsonResponseCallbackWrapper = function (response, body, successCallback, errCallback) {
    var responseHeaders = response['headers'];
    var statusCode = response['statusCode'];

    var isErrorCode = !( statusCode >= 200 && statusCode <= 299 );

    var resp = {
        'statusCode': statusCode,
        'headers': responseHeaders,
        'entity': {status: statusCode, body: body }
    };

    var contentType = responseHeaders['content-type'];

    // If there is no content type, try to parse it anyway
    if ((!contentType || (contentType && contentType.indexOf('json') !== -1)) && body) {
        if (body instanceof Buffer) {
            body = body.toString();
        }

        if (body.indexOf && body.indexOf(constants.SECURITY_STRING) === 0) {
            body = body.substring(constants.SECURITY_STRING.length);
        }

        if (body.length > 0) {
            try {
                resp['entity'] = JSON.parse(body);
            } catch (e) {
                jive.logger.error('Error parsing json body', e);
            }
        }
    }

    if (isErrorCode && errCallback) {
        jive.logger.debug("err:", resp);
        errCallback(resp);
    } else if (successCallback) {
        jive.logger.debug("success:", resp);
        successCallback(resp);
    }

};

var requestMaker = function (method, serverInfo, path, headers, body, secure, requestOptions) {

    if (typeof body === 'undefined' || body === null) {
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

    if (requestOptions) {
        for (var key in requestOptions) {
            if (requestOptions.hasOwnProperty(key)) {
                options[key] = requestOptions[key];
            }
        }
    }

    var postBodyStr;

    if (method === 'POST' || method === 'PUT') {

        if (!(headers['Content-Type'])) {
            if (typeof body === 'object') {
                headers['Content-Type'] = 'application/json'; //If it's an object, set default content type to application/json
            }
            else if (typeof body === 'string') {
                try {
                    var parsed = JSON.parse(body);
                    headers['Content-Type'] = 'application/json'; //If it parses as a JSON object set Content-Type to application/json
                } catch (e) {
                    //do nothing, send request without content type
                }
            }
        }

        postBodyStr = '';
        var contentType = headers['Content-Type'];

        if (contentType === 'application/json') {
            if (typeof body === 'object') {
                postBodyStr = JSON.stringify(body);
            } else if (typeof body === 'string') {
                postBodyStr = body;
            } else {
                throw new Error("Illegal type of post body; only object or string is permitted.");
            }
        } else if (contentType === 'application/x-www-form-urlencoded') {
            var postObject;
            if (typeof body === 'string') {
                try {
                    postObject = JSON.parse(body);
                } catch (e) {
                    postBodyStr = body;
                }
            } else if (typeof body === 'object') {
                postObject = body;
            }
            else {
                throw new Error("Illegal type of post body; only object or string is permitted.");
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
        else {
            postBodyStr = body.toString();
        }

        headers['Content-Length'] = Buffer.byteLength(postBodyStr, 'utf8');
    }

    return {
        execute: function (successCallback, errCallback) {
            var request = require('request');
            var url = ( secure ? 'https' : 'http') + '://' +
                    options['host'] +
                    ( options['port'] ? ':' + options['port'] : ( secure ? (':' + 443) : '' ) ) +
                    options['path']
                ;
            options['url'] = url;
            if (postBodyStr) {
                options['body'] = postBodyStr;
            }

            delete options['host'];
            delete options['path'];

            options['encoding'] = null;
            jive.logger.debug("Request: " + url + ", body: " + postBodyStr);
            request(options, function (error, response, body) {
                if (body
                 && response
                 && response.headers
                 && response.headers['content-encoding'] == 'gzip') {

                    zlib.gunzip( body, function(err, dezipped) {
                        body = dezipped.toString();
                        if (error) {
                            jive.logger.warn("Error making request: %s", JSON.stringify(error));
                            jive.logger.debug("response body: ", response ? (response.statusCode || "no status code") : "no response", body || "no body");
                            jive.logger.debug("Options: %s", JSON.stringify(options));
                            errCallback(error);
                        } else {
                            jsonResponseCallbackWrapper(response, body, successCallback, errCallback);
                        }
                    });
                } else {
                    if (error) {
                        jive.logger.warn("Error making request: %s", JSON.stringify(error));
                        jive.logger.debug("response body: ", response ? (response.statusCode || "no status code") : "no response", body || "no body");
                        jive.logger.debug("Options: %s", JSON.stringify(options));
                        errCallback(error);
                    } else {
                        jsonResponseCallbackWrapper(response, body, successCallback, errCallback);
                    }
                }
            });
        }
    }
};

exports.parseJiveExtensionHeaders = function(req) {
    var authorization = req.headers['authorization'];
    if (!authorization) {
        return;
    }

    var jiveIdentity = {};
    var authVars = authorization.split(' ');
    if (authVars[0] == 'JiveEXTN') {
        // try to parse out jiveURL
        var authParams = authVars[1].split('&');
        authParams.forEach(function (p) {
            if (p.indexOf('jive_url') == 0) {
                jiveIdentity['jiveURL'] = decodeURIComponent(p.split("=")[1]);
            }
            if (p.indexOf('tenant_id') == 0) {
                var tenantID = decodeURIComponent(p.split("=")[1]);
                jiveIdentity['tenantID'] = tenantID;
            }
        });
        return jiveIdentity;
    } else {
        return undefined;
    }
};

