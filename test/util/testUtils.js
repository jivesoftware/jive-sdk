var q = require('q');
var fs = require('fs');
var uuid = require('node-uuid');
var crypto = require('crypto');
var temp = require('temp');
var assert = require('assert');

var sdkUtils = Object.create(require('jive-testing-framework/testUtils'));

module.exports = sdkUtils;

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

sdkUtils.createExampleExternalActivity = function(externalID) {
    return {
        "activity": {
            "action": {
                "name": "posted",
                "description": sdkUtils.guid()
            },
            "actor": {
                "name": sdkUtils.guid(),
                "email": "actor@email.com"
            },
            "object": {
                "type": "website",
                "url": sdkUtils.createFakeURL(),
                "image": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                "title": sdkUtils.guid(),
                "description": sdkUtils.guid()
            },
            "externalID": sdkUtils.guid()
        }
    }
};

sdkUtils.createExampleJiveActivity = function(parent) {
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

sdkUtils.createExampleComment = function(externalID, externalActivityID) {
    return {
        "author": {
            "name": {
                "givenName": sdkUtils.guid(),
                "familyName": sdkUtils.guid()
            },
            "email": sdkUtils.guid() + '@' + sdkUtils.guid() + '.com'
        },
        "content": {"type": "text/html", "text": "<p>" + sdkUtils.guid() + "</p>"},
        "type": "comment",
        "externalID": externalID,
        "externalActivityID": externalActivityID
    };
};

sdkUtils.createExampleDefinition = function(style) {
    var definition = JSON.parse(JSON.stringify(sampleDefinition));
    definition['name'] = sdkUtils.guid();
    definition['id'] = sdkUtils.guid();
    definition['style'] = style || 'LIST';
    return definition;
};

sdkUtils.createExampleInstance = function(jiveCommunity, name, pushUrl) {
    var instance = JSON.parse(JSON.stringify(sampleTileInstance));
    instance['name'] = name || sdkUtils.guid();
    instance['id'] = sdkUtils.guid();
    instance['guid'] = sdkUtils.guid();
    instance['accessToken'] = sdkUtils.guid();
    instance['refreshToken'] = sdkUtils.guid();
    instance['scope'] = sdkUtils.guid();
    instance['url'] = pushUrl || instance['url'] + '/' + sdkUtils.guid();
    instance['jiveCommunity'] = jiveCommunity || sdkUtils.guid() + '.' + instance['jiveCommunity'];
    return instance;
};

sdkUtils.createExampleCommunity = function(jiveUrl) {
    var community = JSON.parse(JSON.stringify(sampleCommunity));
    community['jiveUrl'] = jiveUrl || sdkUtils.createFakeURL();
    community['tenantId'] = sdkUtils.guid();
    community['clientId'] = sdkUtils.guid();
    community['clientSecret'] = sdkUtils.guid();
    community['jiveCommunity'] = require('url').parse(community['jiveUrl']).host;
    return community;
};

sdkUtils.persistExampleDefinitions = function(jive, quantity, style) {
    var definitions = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var definition = sdkUtils.createExampleDefinition(style);

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

sdkUtils.persistExampleInstances = function(jive, quantity, jiveCommunity, name, pushUrl) {
    var instances = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var instance = sdkUtils.createExampleInstance(jiveCommunity, name, pushUrl);

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

sdkUtils.persistExampleCommunities = function(jive, quantity,jiveUrl) {
    var communities = [];
    var promises = [];

    for ( var i = 0; i < quantity; i++ ){
        var instance = sdkUtils.createExampleCommunity(jiveUrl);

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

sdkUtils.setupService = function(jive, config) {
    var p = q.defer();
    var startHttp = config && (!config['role'] || config['role'] == 'http');
    var app = startHttp ? require('express')() : {use: function() {}, all: function() {}};
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

sdkUtils.createBaseServiceOptions = function(sourceDir) {
    return {
        'svcRootDir' : sdkUtils.getResourceFilePath(sourceDir),
        'persistence' : 'memory',
        'logLevel' : 'FATAL',
        'skipCreateExtension' : true,
        'clientUrl' : sdkUtils.createFakeURL(),
        'role' : 'worker',
        'suppressHttpLogging' : true
    };
};

sdkUtils.createAuthorizationHeader = function( community ) {
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

sdkUtils.runServerTest = function(testUtils, jive, done, serverOptions, test, tileDir) {
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