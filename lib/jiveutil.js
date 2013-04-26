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
var mustache = require('mustache');
var jive = require('../api');

exports.guid = function() {
    return uuid.v4();
};

var jsonResponseCallbackWrapper = function (response, body, successCallback, errCallback) {
    var responseHeaders = response['headers'];
    var statusCode = response['statusCode'];

    var isErrorCode = !( statusCode >= 200 && statusCode <= 299 );

    var resp = {
        'statusCode' : statusCode,
        'headers' : responseHeaders
    };

    if ( body && body.length > 0 ) {
        try {
            resp['entity'] = JSON.parse(body);
        } catch( e ) {
           resp['entity'] = {status: statusCode, body: body }
        }
    }

    if ( isErrorCode && errCallback) {
        jive.logger.debug("err:", resp);
        errCallback(resp);
    } else if (successCallback) {
        jive.logger.debug("success:", resp);
        successCallback(resp);
    }

};

var requestMaker = function (method, serverInfo, path, headers, body, secure, requestOptions ) {

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

    if ( requestOptions  ) {
        for ( var key in requestOptions ) {
            if ( requestOptions.hasOwnProperty(key) ) {
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

        if ( contentType === 'application/json') {
            if ( typeof body === 'object' ) {
                postBodyStr = JSON.stringify(body);
            } else if (typeof body === 'string' ) {
                postBodyStr = body;
            } else {
                throw "Illegal type of post body; only object or string is permitted.";
            }
        } else if (contentType === 'application/x-www-form-urlencoded') {
            var postObject;
            if ( typeof body === 'string' ) {
                try {
                    postObject = JSON.parse( body );
                } catch (e) {
                    postBodyStr = body;
                }
            } else if (typeof body === 'object') {
                postObject = body;
            }
            else  {
                throw "Illegal type of post body; only object or string is permitted.";
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
                if (error) {
                    console.log("Error making request: %s", JSON.stringify(error));
                    console.log("Options: %s", JSON.stringify(options));
                    errCallback(error);
                }
                else {
                    jsonResponseCallbackWrapper(response, body, successCallback, errCallback );
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

    var deferred = q.defer();

    requestMaker(
        method,
        { host: host, port: port },
        path,
        headers || {},
        postBody,
        protocol && protocol.indexOf( 'https' ) == 0,
        requestOptions || {}
    ).execute(
        // success
        function(response) {
            deferred.resolve(response);
        },

        // failure
        function(response) {
            deferred.reject(response);
        }
    );

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
    jive.logger.debug('Copying',source,'to',target);
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


var fsSimpleRename = function( source, target ) {
    var deferred = q.defer();

    fs.rename(source, target, function(err){
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return deferred;
};

exports.fsrename = function(source, target, force) {
    jive.logger.debug('Renaming',source,'to',target);
    if ( !force ) {
        return fsSimpleRename(source, target);
    }

    var deferred = q.defer();
    exports.fsexists( target ).then( function(exists) {
        if ( exists ) {
            if ( force ) {
                // delete
                return exports.fsrmdir(target).then( function() {
                    // do rename
                    jive.logger.debug('Renaing',source,'->',target);
                    return fsSimpleRename(source, target);
                }, function(){
                    jive.logger.debug(target,'could not be removed');
                    deferred.reject();
                });
            } else {
                // skipping since exists already
                jive.logger.debug(target,'already exists, skipping');
                deferred.resolve();
            }
        } else {
            // do rename
            return fsSimpleRename(source, target);
        }
    });

    return deferred.promise;
};

exports.fsmkdir = function(path) {
    jive.logger.debug('Creating directory',path);
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

exports.fsreaddir = function(path) {
    var deferred = q.defer();

    fs.readdir( path, function(err, items) {
        deferred.resolve(items);
        return items;
    });

    return deferred.promise;
};

var removeRecursive = function(path,cb){
    fs.stat(path, function(err, stats) {
        if(err){
            cb(err,stats);
            return;
        }
        if(stats.isFile()){
            fs.unlink(path, function(err) {
                if(err) {
                    cb(err,null);
                }else{
                    cb(null,true);
                }
                return;
            });
        }else if(stats.isDirectory()){
            // A folder may contain files
            // We need to delete the files first
            // When all are deleted we could delete the
            // dir itself
            fs.readdir(path, function(err, files) {
                if(err){
                    cb(err,null);
                    return;
                }
                var f_length = files.length;
                var f_delete_index = 0;

                // Check and keep track of deleted files
                // Delete the folder itself when the files are deleted

                var checkStatus = function(){
                    // We check the status
                    // and count till we r done
                    if(f_length===f_delete_index){
                        fs.rmdir(path, function(err) {
                            if(err){
                                cb(err,null);
                            }else{
                                cb(null,true);
                            }
                        });
                        return true;
                    }
                    return false;
                };
                if(!checkStatus()){
                    for(var i=0;i<f_length;i++){
                        // Create a local scope for filePath
                        // Not really needed, but just good practice
                        // (as strings arn't passed by reference)
                        (function(){
                            var filePath = path + '/' + files[i];
                            // Add a named function as callback
                            // just to enlighten debugging
                            removeRecursive(filePath,function removeRecursiveCB(err,status){
                                if(!err){
                                    f_delete_index ++;
                                    checkStatus();
                                }else{
                                    cb(err,null);
                                    return;
                                }
                            });

                        })()
                    }
                }
            });
        }
    });
};

exports.fsrmdir = function(path) {
    var deferred = q.defer();

    removeRecursive( path, function(err, stats) {
        if ( err ) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
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

exports.fsTemplateCopy = function( source, target, substitutions ) {
    jive.logger.debug('Copying', source, '->', target );
    return exports.fsread(source).then( function( data ) {
        var raw = data.toString();
        var processed = mustache.render(raw, substitutions || {} );
        return exports.fswrite(processed, target);
    });
};

exports.base64Encode = function( object ) {
    return new Buffer( JSON.stringify( object) ).toString('base64');
};

exports.base64Decode = function( str ) {
    return new Buffer(str, 'base64').toString('ascii');;
};
