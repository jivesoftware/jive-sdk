var q = require('q');
var fs = require('fs');
var uuid = require('node-uuid');
var crypto = require('crypto');
var temp = require('temp');

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

exports.createExampleDefinition = function() {
    var definition = JSON.parse(JSON.stringify(sampleDefinition));
    definition['name'] = exports.guid();
    definition['id'] = exports.guid();
    return definition;
};

exports.createExampleInstance = function() {
    var instance = JSON.parse(JSON.stringify(sampleTileInstance));
    instance['name'] = exports.guid();
    instance['id'] = exports.guid();
    instance['guid'] = exports.guid();
    instance['accessToken'] = exports.guid();
    instance['refreshToken'] = exports.guid();
    instance['scope'] = exports.guid();
    instance['url'] = instance['url'] + '/' + exports.guid();
    instance['jiveCommunity'] = exports.guid() + '.' + instance['jiveCommunity'];
    return instance;
};

exports.createExampleCommunity = function() {
    var community = JSON.parse(JSON.stringify(sampleCommunity));
    community['jiveUrl'] = exports.createFakeURL();
    community['tenantId'] = exports.guid();
    community['clientId'] = exports.guid();
    community['clientSecret'] = exports.guid();
    community['jiveCommunity'] = require('url').parse(community['jiveUrl']).host;
    return community;
};

exports.persistExampleDefinitions = function(jive, quantity) {
    var definitions = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var definition = exports.createExampleDefinition();

        var p = jive.tiles.definitions.save(definition).then(function(saved) {
            definitions.push(saved);
            return q.resolve();
        });
        promises.push( p );
    }

    return q.all(promises).then( function() {
        return definitions;
    });
};

exports.persistExampleInstances = function(jive, quantity) {
    var instances = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var instance = exports.createExampleInstance();

        var p = jive.tiles.save(instance).then(function(saved) {
            instances.push(saved);
            return q.resolve();
        });
        promises.push( p );
    }

    return q.all(promises).then( function() {
        return instances;
    });
};

exports.persistExampleCommunities = function(jive, quantity) {
    var communities = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var instance = exports.createExampleCommunity();

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
    return jive.service.init( {use: function() {}}, config).then( function() {
        return jive.service.autowire();
    }).then( function() {
        return jive.service.start().then( function() {
            console.log();
        });
    });
};

