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
 * Library of useful functions.
 * @module jiveutil
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var q = require('q');
var fs = require('fs-extra');
var uuid = require('node-uuid');
var mustache = require('mustache');
var jive = require('../../api');
var oauth = require('./oauth');
var iterator = require('./iterator');
var crypto = require('crypto');
var constants = require("./constants");
var jiveRequest = require("./request");

var hex_high_10 = { // set the highest bit and clear the next highest
    '0': '8',
    '1': '9',
    '2': 'a',
    '3': 'b',
    '4': '8',
    '5': '9',
    '6': 'a',
    '7': 'b',
    '8': '8',
    '9': '9',
    'a': 'a',
    'b': 'b',
    'c': '8',
    'd': '9',
    'e': 'a',
    'f': 'b'
};

/**
 * Useful general utility functions.
 * @returns {String} guid
 */

exports.guid = function (src) {
    if (!src) {
        return uuid.v4();
    } else {
        var sum = crypto.createHash('sha1');

        // namespace in raw form. FIXME using ns:URL for now, what should it be?
        sum.update(new Buffer('a6e4EZ2tEdGAtADAT9QwyA==', 'base64'));

        // add HTTP path
        sum.update(src);

        // get sha1 hash in hex form
        var u = sum.digest('hex');

        // format as UUID (add dashes, version bits and reserved bits)
        u =
            u.substr(0, 8) + '-' + // time_low
                u.substr(8, 4) + '-' + // time_mid
                '5' + // time_hi_and_version high 4 bits (version)
                u.substr(13, 3) + '-' + // time_hi_and_version low 4 bits (time high)
                hex_high_10[u.substr(16, 1)] + u.substr(17, 1) + // cloc_seq_hi_and_reserved
                u.substr(18, 2) + '-' + // clock_seq_low
                u.substr(20, 12); // node
        return u;
    }
};

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
    return jiveRequest.buildRequest(url, method, postBody, headers, requestOptions );
};

/**
 * Useful request related utilities
 * @type module:jiveRequest
 */
exports.request = jiveRequest;

/**
 * Gets the file size in bytes.
 * @param filename - the path to the file.
 * @return {Promise} Promise
 */
exports.fsGetSize = function (filename) {
    var deferred = q.defer();
    fs.stat(filename, function (err, stats) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(stats.size);
        }
    });
    return deferred.promise;
};

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsexists = function (path) {
    var deferred = q.defer();
    var method = fs.exists ? fs.exists : require('path').exists;
    method(path, function (exists) {
        deferred.resolve(exists);
    });

    return deferred.promise;
};

/**
 * @param source
 * @param target
 * @return {Promise} Promise
 */
exports.fscopy = function (source, target) {
    jive.logger.debug('Copying', source, 'to', target);
    var deferred = q.defer();

    fs.copy(source, target, function (err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};


var fsSimpleRename = function (source, target) {
    var deferred = q.defer();

    fs.rename(source, target, function (err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * @param source
 * @param target
 * @param force
 * @return {Promise} Promise
 */
exports.fsrename = function (source, target, force) {
    jive.logger.debug('Renaming', source, 'to', target);
    if (!force) {
        return fsSimpleRename(source, target);
    }

    return exports.fsexists(target).then(function (exists) {
        if (exists) {
            // delete
            return exports.fsrmdir(target).then(function () {
                // do rename
                jive.logger.debug('Renaming', source, '->', target);
                return fsSimpleRename(source, target);
            });
        } else {
            // do rename
            return fsSimpleRename(source, target);
        }
    });
};

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsmkdir = function (path) {
    jive.logger.debug('Creating directory', path);
    var deferred = q.defer();

    fs.mkdirs(path, function (err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsread = function (path) {
    var deferred = q.defer();
    fs.readFile(path, function (err, data) {
        deferred.resolve(data);
        return data;
    });
    return deferred.promise;
};

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsreadJson = function (path) {
    return exports.fsread(path).then(function (data) {
        return JSON.parse(new Buffer(data).toString());
    });
};

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsreaddir = function (path) {
    var deferred = q.defer();

    fs.readdir(path, function (err, items) {
        deferred.resolve(items);
        return items;
    });

    return deferred.promise;
};

var removeRecursive = function (path, cb) {
    fs.stat(path, function (err, stats) {
        if (err) {
            cb(err, stats);
            return;
        }
        if (stats.isFile()) {
            fs.unlink(path, function (err) {
                if (err) {
                    cb(err, null);
                } else {
                    cb(null, true);
                }
                return;
            });
        } else if (stats.isDirectory()) {
            // A folder may contain files
            // We need to delete the files first
            // When all are deleted we could delete the
            // dir itself
            fs.readdir(path, function (err, files) {
                if (err) {
                    cb(err, null);
                    return;
                }
                var f_length = files.length;
                var f_delete_index = 0;

                // Check and keep track of deleted files
                // Delete the folder itself when the files are deleted

                var checkStatus = function () {
                    // We check the status
                    // and count till we r done
                    if (f_length === f_delete_index) {
                        fs.rmdir(path, function (err) {
                            if (err) {
                                cb(err, null);
                            } else {
                                cb(null, true);
                            }
                        });
                        return true;
                    }
                    return false;
                };
                if (!checkStatus()) {
                    for (var i = 0; i < f_length; i++) {
                        // Create a local scope for filePath
                        // Not really needed, but just good practice
                        // (as strings arn't passed by reference)
                        (function () {
                            var filePath = path + '/' + files[i];
                            // Add a named function as callback
                            // just to enlighten debugging
                            removeRecursive(filePath, function removeRecursiveCB(err, status) {
                                if (!err) {
                                    f_delete_index++;
                                    checkStatus();
                                } else {
                                    cb(err, null);
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

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsrmdir = function (path) {
    var deferred = q.defer();

    removeRecursive(path, function (err, stats) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * @param path
 * @return {Promise} Promise
 */
exports.fsisdir = function (path) {
    var deferred = q.defer();

    fs.stat(path, function (err, stats) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(stats.isDirectory());
        }
    });

    return deferred.promise;
};

/**
 * @param data
 * @param path
 * @return {Promise} Promise
 */
exports.fswrite = function (data, path) {
    var deferred = q.defer();

    fs.writeFile(path, data, function (err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

var supportedTemplatableExtensions = [ '.json', '.txt', '.text', '.js', '.sql', '.html', '.xml' ];

function getExtension(filename) {
    if (!filename) {
        return;
    }
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

/**
 * @param source
 * @param target
 * @param substitutions
 * @return {Promise} Promise
 */
exports.fsTemplateCopy = function (source, target, substitutions) {
    var ext = getExtension(source);
    if (!ext || supportedTemplatableExtensions.indexOf(ext.toLowerCase()) < 0 || !substitutions) {
        jive.logger.debug(source + ' is not a supported templatable file type. Doing straight copying', source, '->', target);
        return exports.fscopy(source, target);
    } else {
        jive.logger.debug('Templatized Copying', source, '->', target);
        return exports.fsread(source).then(function (data) {
            var raw = data.toString();
            var processed = mustache.render(raw, substitutions || {});
            return exports.fswrite(processed, target);
        });
    }
};

/**
 * @param data
 * @param target
 * @param substitutions
 * @return {Promise} Promise
 */
exports.fsTemplateWrite = function (data, target, substitutions) {
    var ext = getExtension(target);
    if (!ext || supportedTemplatableExtensions.indexOf(ext.toLowerCase()) < 0) {
        jive.logger.debug(target + ' is not a supported templatable file type. Doing straight write ->', target);
        return exports.fswrite(data, target);
    } else {
        jive.logger.debug('Templatized write ->', target);
        var processed = mustache.render(data, substitutions || {});
        return exports.fswrite(processed, target);
    }
};

/**
 * @param source
 * @param substitutions
 * @return {Promise} Promise
 */
exports.fsTemplateRead = function (source, substitutions) {
    return exports.fsread(source).then(function (data) {
        var raw = data.toString();
        return mustache.render(raw, substitutions || {});
    });
};

/**
 * @param object
 * @returns {*|string}
 */
exports.base64Encode = function (object) {
    return new Buffer(JSON.stringify(object)).toString('base64');
};

/**
 * @param str
 * @returns {*|string}
 */
exports.base64Decode = function (str) {
    return new Buffer(str, 'base64').toString('ascii');
};

/**
 * @param auth
 * @param clientId
 * @param clientSecret
 * @param authRequired
 * @returns {boolean}
 */
exports.basicAuthorizationHeaderValid = function (auth, clientId, clientSecret, authRequired) {
    if (!auth && !authRequired) {
        return true;
    }

    if (auth.indexOf('Basic ') == 0) {
        var authParts = auth.split('Basic ');
        var p = new Buffer(authParts[1], 'base64').toString();
        var pParts = p.split(':');
        var authClientId = pParts[0];
        var authSecret = pParts[1];

        if (authClientId !== clientId || authSecret !== clientSecret) {
            return false;
        }
    } else {
        return !authRequired;
    }
    return true;
};

/**
 * @param auth
 * @param clientId
 * @param clientSecret
 * @param authRequired
 * @returns {boolean}
 */
exports.jiveAuthorizationHeaderValid = function (auth, clientId, clientSecret, authRequired) {
    if (!auth && !authRequired) {
        return true;
    }

    if ( !clientSecret ) {
        return false;
    }

    var authVars = auth.split(' ');
    var authFlag = authVars[0];
    if (authFlag == 'JiveEXTN') {
        var str = '';
        var authParams = authVars[1].split('&');
        var signature;
        authParams.forEach(function (p) {
            if (p.indexOf('signature') == 0) {
                signature = p.split("signature=")[1];
            } else {
                if (str.length > 0) {
                    str += '&';
                }
                str += p;
            }
        });

        //do signature verification
        var hmac_signature = crypto.createHmac('SHA256', new Buffer(clientSecret, 'base64')).update(str).digest('base64');
        return hmac_signature == decodeURIComponent(signature);
    } else {
        return true;
    }
};

/**
 * @param o
 * @returns {{}}
 */
exports.sortObject = function (o) {
    var sorted = {},
        key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
};

/**
 * @param currentFsItem
 * @param root
 * @param targetRoot
 * @param force
 * @param processor
 * @return {Promise} Promise
 */
exports.recursiveDirectoryProcessor = function (currentFsItem, root, targetRoot, force, processor) {

    var recurseDirectory = function (directory) {
        return q.nfcall(fs.readdir, directory).then(function (subItems) {
            var promises = [];
            subItems.forEach(function (subItem) {
                promises.push(exports.recursiveDirectoryProcessor(directory + '/' + subItem, root, targetRoot, force, processor));
            });

            return q.all(promises);
        });
    };

    return q.nfcall(fs.stat, currentFsItem).then(function (stat) {
        var targetPath = targetRoot + '/' + currentFsItem.substr(root.length + 1, currentFsItem.length);

        if (stat.isDirectory()) {
            if (root !== currentFsItem) {
                return exports.fsexists(targetPath).then(function (exists) {
                    if (root == currentFsItem || (exists && !force)) {
                        return recurseDirectory(currentFsItem);
                    } else {
                        return processor('dir', currentFsItem, targetPath).then(function () {
                            return recurseDirectory(currentFsItem)
                        });
                    }
                });
            }

            return recurseDirectory(currentFsItem);
        }

        // must be a file
        return exports.fsexists(targetPath).then(function (exists) {
            if (!exists || force) {
                return processor('file', currentFsItem, targetPath)
            } else {
                return q.fcall(function () {
                });
            }
        });
    });
};

var copyFileProcessor = function (type, currentFsItem, targetPath, substitutions) {
    return q.fcall(function () {
        if (type === 'dir') {
            return exports.fsmkdir(targetPath);
        } else {
            // must be file
            return exports.fsTemplateCopy(currentFsItem, targetPath, substitutions);
        }
    });
};

/**
 * @param root
 * @param target
 * @param force
 * @param substitutions
 * @param file
 * @return {Promise} Promise
 */
exports.recursiveCopy = function (root, target, force, substitutions, file) {
    return exports.fsisdir(root).then( function(isDir) {
        if( !isDir ) {
            return copyFileProcessor("file", root, target, substitutions);
        }

        var substitutionProcessor = function (type, currentFsItem, targetPath) {
            return copyFileProcessor(type, currentFsItem, targetPath, substitutions);
        };

        return exports.recursiveDirectoryProcessor(
            root,
            root,
            target,
            force,
            substitutionProcessor
        );
    });
};

/**
 * @param root
 * @param targetZip
 * @param flatten
 * @return {Promise} Promise
 */
exports.zipFolder = function (root, targetZip, flatten) {
    var fs = require('fs');
    var deferred = q.defer();

    var archiver = require('archiver');
    var archive = archiver('zip');

    var output = fs.createWriteStream(targetZip);

    output.on('close', function(arguments) {
        deferred.resolve();
    });

    archive.on('error', function (err) {
        deferred.reject(err);
    });

    archive.pipe(output);

    exports.recursiveDirectoryProcessor(root, root, '/tmp', true,function (type, currentFsItem, targetPath, substitutions) {
        return q.fcall(function () {
            if (type === 'file') {
                var target = currentFsItem.substring(currentFsItem.indexOf('/') + 1, currentFsItem.length);
                if (flatten) {
                    target = require('path').basename(target);
                }
                jive.logger.debug('Zipping', currentFsItem, 'to', targetZip, ' : ', target);
                archive.append(fs.createReadStream(currentFsItem), { name: target })
            }
        });
    }).then(function () {
        archive.finalize(function (err, written) {
            if (err) {
                deferred.reject(err);
            }
            jive.logger.info(written + ' total bytes written to extension archive ', targetZip);
        });
    });

    return deferred.promise;
};

/**
 * @type {*}
 */
exports.oauth = oauth;

/**
 * @type {*}
 */
exports.iterator = iterator;
