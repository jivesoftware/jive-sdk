var q = require('q');
var fs = require('fs');
var uuid = require('node-uuid');
var crypto = require('crypto');
var temp = require('temp');
var assert = require('assert');

// track temp files
temp.track();

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
                return fsexists(targetPath).then(function (exists) {
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
        return fsexists(targetPath).then(function (exists) {
            if (!exists || force) {
                return processor('file', currentFsItem, targetPath)
            } else {
                return q.fcall(function () {
                });
            }
        });
    });
};

var fsexists = function (path) {
    var deferred = q.defer();
    var method = fs.exists ? fs.exists : require('path').exists;
    method(path, function (exists) {
        deferred.resolve(exists);
    });

    return deferred.promise;
};

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

var sampleDefinition = {
    "displayName": "Filter Results",
    "name": "test",
    "description": "Shows the issues/results for a saved filter.",
    "style": "LIST",
    "icons": {
        "16": "http://test.com/images/jira16.png",
        "48": "http://test.com/images/jira48.png",
        "128": "http://test.com/images/jira128.png"
    },
    "action": "/filterresults/action",
    "definitionDirName": "filterresults"
};

var sampleTileInstance = {
    "url": "http://lt-a7-120000.jiveland.com:8080/api/jivelinks/v1/tiles/3895/data",
    "config": {
        "ticketID": "FDDCF31F85C65FACCC1118A5449BEEC5DD81CC73",
        "parent": "http://lt-a7-120000.jiveland.com:8080/api/core/v3/places/13280",
        "filter": "14740"
    },
    "name": "filterresults",
    "accessToken": "81pak4yfw47pkcsndhbhbjpokgdwrd21by6b369b.t",
    "expiresIn": "172799",
    "refreshToken": "hbjhtv7vd6ftt1nq2ntm11tmcc1bi1f4xxs608hd.r",
    "scope": "uri:/api/jivelinks/v1/tiles/3895",
    "guid": "fe519521-f3f8-4028-a03b-c51d6a74b0e3-dev_3895",
    "jiveCommunity": "lt-a7-120000.jiveland.com"
};

var sampleCommunity = {
    "jiveUrl": "http://lt-a7-120000.jiveland.com:8080",
    "version": "post-samurai",
    "tenantId": "fe519521-f3f8-4028-a03b-c51d6a74b0e3-dev",
    "clientId": "nupmcbes7biwedkjpav7g8bzw4egb6yq.i",
    "clientSecret": "o8q1mnhhjy1gb497ngo0kvw6fmpbjfl8.s",
    "jiveCommunity": "lt-a7-120000.jiveland.com"
};
exports.createExampleExternalActivity = function(externalID) {
    return {
        "activity": {
            "action": {
                "name": "posted",
                "description": exports.guid()
            },
            "actor": {
                "name": exports.guid(),
                "email": "actor@email.com"
            },
            "object": {
                "type": "website",
                "url": exports.createFakeURL(),
                "image": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                "title": exports.guid(),
                "description": exports.guid()
            },
            "externalID": exports.guid()
        }
    }
};

exports.createExampleJiveActivity = function(parent) {
    var commentURL = parent + '/comments';
    return {
        "resources" : {
            "comments" : {
                "ref" : commentURL
            }
        },
        "parent" : parent
    }
};

exports.createExampleComment = function(externalID, externalActivityID) {
    return {
        "author": {
            "name": {
                "givenName": exports.guid(),
                "familyName": exports.guid()
            },
            "email": exports.guid() + '@' + exports.guid() + '.com'
        },
        "content": {"type": "text/html", "text": "<p>" + exports.guid() + "</p>"},
        "type": "comment",
        "externalID": externalID,
        "externalActivityID": externalActivityID
    };
};

exports.createExampleDefinition = function(style) {
    var definition = JSON.parse(JSON.stringify(sampleDefinition));
    definition['name'] = exports.guid();
    definition['id'] = exports.guid();
    definition['style'] = style || 'LIST';
    return definition;
};

exports.createExampleInstance = function(jiveCommunity, name, pushUrl) {
    var instance = JSON.parse(JSON.stringify(sampleTileInstance));
    instance['name'] = name || exports.guid();
    instance['id'] = exports.guid();
    instance['guid'] = exports.guid();
    instance['accessToken'] = exports.guid();
    instance['refreshToken'] = exports.guid();
    instance['scope'] = exports.guid();
    instance['url'] = pushUrl || instance['url'] + '/' + exports.guid();
    instance['jiveCommunity'] = jiveCommunity || exports.guid() + '.' + instance['jiveCommunity'];
    return instance;
};

exports.createExampleCommunity = function(jiveUrl) {
    var community = JSON.parse(JSON.stringify(sampleCommunity));
    community['jiveUrl'] = jiveUrl || exports.createFakeURL();
    community['tenantId'] = exports.guid();
    community['clientId'] = exports.guid();
    community['clientSecret'] = exports.guid();
    community['jiveCommunity'] = require('url').parse(community['jiveUrl']).host;
    return community;
};

exports.persistExampleDefinitions = function(jive, quantity, style) {
    var definitions = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var definition = exports.createExampleDefinition(style);

        var p = jive.tiles.definitions.save(definition).then(function(saved) {
            definitions.push(saved);
            return q.resolve();
        });
        promises.push( p );
    }

    return q.all(promises).then( function() {
        return quantity == 1 ? definitions[0] : definitions;
    });
};

exports.persistExampleInstances = function(jive, quantity, jiveCommunity, name, pushUrl) {
    var instances = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var instance = exports.createExampleInstance(jiveCommunity, name, pushUrl);

        var p = jive.tiles.save(instance).then(function(saved) {
            instances.push(saved);
            return q.resolve();
        });
        promises.push( p );
    }

    return q.all(promises).then( function() {
        return quantity == 1 ? instances[0] : instances;
    });
};

exports.persistExampleCommunities = function(jive, quantity,jiveUrl) {
    var communities = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var instance = exports.createExampleCommunity(jiveUrl);

        var p = jive.community.save(instance).then(function(saved) {
            communities.push(saved);
            return q.resolve();
        });
        promises.push( p );
    }

    return q.all(promises).then( function() {
        return quantity == 1 ? communities[0] : communities;
    });
};

exports.createFakeURL = function(fakePath) {
    var url = 'http://' + exports.guid() + '.com';
    if ( fakePath ) {
        url += '/' + exports.guid();
    }

    return url;
};

exports.createTempDir = function() {
    var deferred = q.defer();
    temp.mkdir(exports.guid(), function(err, dirPath) {
        deferred.resolve(dirPath);
    });
    return deferred.promise;
};

exports.cleanupTemp = function() {
    temp.cleanup();
};

exports.getResourceFilePath = function(filename) {
    return process.cwd() + '/resources/' + filename;
};

exports.setupService = function(jive, config) {
    var p = q.defer();
    var startHttp = config && (!config['role'] || config['role'] == 'http');
    var app = startHttp ? require('express')() : {use: function() {}};
    jive.service.init( app, config).then(function() {
        return jive.service.autowire();
    }).then( function() {
        return jive.service.start();
    }).then( function() {

        var deferred = q.defer();
        if ( startHttp ) {
            var server = require('http').createServer(app);
            server.listen(config.port, function () {
                deferred.resolve(server);
            } );
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    }).then( function(server) {
        p.resolve({
            'stop' : function() {
                if ( server ) {
                    server.close();
                }
                return jive.service.stop();
            }
        });
    }).fail( function(e) {
        p.reject(e);
    });

    return p.promise;
};

exports.waitSec = function(seconds) {
    var deferred = q.defer();
    setTimeout( function() { deferred.resolve() }, seconds * 1000);
    return deferred.promise;
};

exports.createBaseServiceOptions = function(sourceDir) {
    return {
        'svcRootDir' : exports.getResourceFilePath(sourceDir),
        'persistence' : 'memory',
        'logLevel' : 'FATAL',
        'skipCreateExtension' : true,
        'clientUrl' : exports.createFakeURL(),
        'role' : 'worker',
        'suppressHttpLogging' : true
    };
};

exports.createServer = function(config) {
    var d = q.defer();
    var server = require('./serverControl');

    server.start(config).then(
        function() {
            // build up endpoints
            var routes = config['routes'] || [];
            var promises = [];

            routes.forEach( function(route) {
                if ( route && route['method'] ) {
                    var p = server.setEndpoint(
                        route['method'],
                        route['statusCode'],
                        route['path'],
                        route['body'],
                        route['handler']
                    );
                    promises.push(p);
                }
            });

            return q.all(promises);
        }, function() {
           return q.reject();
        }
    ).then( function() {
        return d.resolve(server);
    });

    return d.promise;
};

exports.createAuthorizationHeader = function( community ) {
    var jiveURL = community['jiveUrl'], tenantId = community['tenantId'],
        clientId = community['clientId'], clientSecret = community['clientSecret'];
    var header = 'JiveEXTN ';
    var headerDetail='';
    headerDetail += 'algorithm=HmacSHA256';
    headerDetail += '&client_id=' + clientId;
    headerDetail += '&jive_url=' + encodeURIComponent( jiveURL );
    headerDetail += '&tenant_id=' + tenantId;
    headerDetail += '&timestamp=' + new Date().getTime();

    var hmac_signature = require('crypto').createHmac('SHA256', new Buffer(clientSecret, 'base64')).update(headerDetail).digest('base64');

    header += headerDetail;
    header += '&signature=' + hmac_signature;

    return header;
};

exports.runServerTest = function(testUtils, jive, done, serverOptions, test, tileDir) {
    serverOptions = serverOptions || {
        'port' : 5556,
        'routes' : [
            {
                'method' : 'post',
                'statusCode' : '200',
                'path' : '/oauth2/token',
                'body' : {
                    'access_token' : testUtils.guid(),
                    'expiresIn' : new Date().getTime(),
                    'refreshToken' : testUtils.guid()
                }
            }
        ]
    };

    var community;
    var service;
    var jiveServer;

    var tearDown = function(jive, service, jiveServer) {
        return (service ? service : q.resolve() ).stop().then( function() {
            return (jiveServer ? jiveServer : q.resolve()).stop();
        });
    };

    testUtils.createServer( serverOptions ).then( function(_jiveServer ) {
        jiveServer = _jiveServer;
        return q.resolve();
    }).then( function(){
        // setup service options
        var options = testUtils.createBaseServiceOptions(tileDir || '/services/tile_simple');
        delete options['role'];
        options['port'] = 5555; options['logLevel'] = 'FATAL'; options['clientUrl'] = 'http://localhost:5555';
        if ( serverOptions['development'] ) {
            options['development'] = true;
        }
        return testUtils.setupService(jive, options);
    }).then(function(_service) {
        service = _service;
        return testUtils.persistExampleCommunities(jive, 1, 'http://localhost:5556')
    }).then( function (_community ) {
        community = _community;
        return q.resolve(community);
    }).then( function() {
        // do some tests
        return test(testUtils, jive, community);
    }).then(
        function() {
            return tearDown(jive, service, jiveServer).then( function() {
                done();
            });
        },
        function (e) {
            return tearDown(jive, service, jiveServer).then( function() {
                assert.fail(e[0], e[1]);
            });
        }
    );
};

exports.fsread = function (path) {
    var deferred = q.defer();
    fs.readFile(path, function (err, data) {
        deferred.resolve(data);
        return data;
    });
    return deferred.promise;
};

exports.fsreadJson = function (path) {
    return exports.fsread(path).then(function (data) {
        return JSON.parse(new Buffer(data).toString());
    });
};

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