var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('tiles registration', function () {

        var tearDown = function(jive, service, jiveServer) {
            return (service ? service : q.resolve() ).stop().then( function() {
                return (jiveServer ? jiveServer : q.resolve()).stop();
            });
        };

        it('happy path', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            // setup mock jive
            var app = express();

            var community;
            var service;
            var jiveServer;

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.createServer( {
                'port' : 5556,
                'routes' : [
                    {
                        'method' : 'post',
                        'statusCode' : '200',
                        'path' : '/oauth2/token',
                        'body' : expectedAccessToken
                    }
                ]
            }).then( function(_jiveServer ) {
                jiveServer = _jiveServer;
                return q.resolve();
            }).then( function(){
                // setup service options
                var options = testUtils.createBaseServiceOptions('/services/tile_simple');
                delete options['role'];
                options['port'] = 5555; options['logLevel'] = 'FATAL'; options['clientUrl'] = 'http://localhost:5555';
                return testUtils.setupService(jive, options, app);
            }).then(function(_service) {
                service = _service;
                return testUtils.persistExampleCommunities(jive, 1, 'http://localhost:5556')
            }).then( function (_community ) {
                community = _community;
                return q.resolve(community);
            }).then( function() {
                // do some tests
                var header = testUtils.createAuthorizationHeader(community);
                return jive.util.buildRequest('http://localhost:5555/registration', 'POST',
                    // body
                    {
                        'guid'          :   jive.util.guid(),
                        'remoteID'      :   jive.util.guid(),
                        'config'        :   { 'my' : 'config' },
                        'name'          :   'samplelist',
                        'jiveUrl'       :   community['jiveUrl'],
                        'tenantID'      :   community['tenantId'],
                        'pushUrl'       :   testUtils.createFakeURL(),
                        'code'          :   testUtils.guid()
                    },

                    // headers
                    {
                        'Authorization' : header
                    }
                ).then( function(response) {
                    assert.ok(response);
                    assert.ok(response['entity']);
                    assert.equal( response['entity']['accessToken'], expectedAccessToken['access_token'] );
                    assert.equal( response['entity']['refreshToken'], expectedAccessToken['refresh_token'] );
                    assert.equal( response['entity']['expiresIn'], expectedAccessToken['expires_in'] );
                }, function(e) {
                    assert.fail(e, 'instance');
                });
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
        });

        it('unrecognized tile name', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            // setup mock jive
            var app = express();

            var community;
            var service;
            var jiveServer;

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.createServer( {
                'port' : 5556,
                'routes' : [
                    {
                        'method' : 'post',
                        'statusCode' : '200',
                        'path' : '/oauth2/token',
                        'body' : expectedAccessToken
                    }
                ]
            }).then( function(_jiveServer ) {
                jiveServer = _jiveServer;
                return q.resolve();
            }).then( function(){
                // setup service options
                var options = testUtils.createBaseServiceOptions('/services/tile_simple');
                delete options['role'];
                options['port'] = 5555; options['logLevel'] = 'FATAL'; options['clientUrl'] = 'http://localhost:5555';
                return testUtils.setupService(jive, options, app);
            }).then(function(_service) {
                service = _service;
                return testUtils.persistExampleCommunities(jive, 1, 'http://localhost:5556')
            }).then( function (_community ) {
                community = _community;
                return q.resolve(community);
            }).then( function() {
                // do some tests
                var header = testUtils.createAuthorizationHeader(community);
                return jive.util.buildRequest('http://localhost:5555/registration', 'POST',
                    // body
                    {
                        'guid'          :   jive.util.guid(),
                        'remoteID'      :   jive.util.guid(),
                        'config'        :   { 'my' : 'config' },
                        'name'          :   'XsamplelistX',
                        'jiveUrl'       :   community['jiveUrl'],
                        'tenantID'      :   community['tenantId'],
                        'pushUrl'       :   testUtils.createFakeURL(),
                        'code'          :   testUtils.guid()
                    },

                    // headers
                    {
                        'Authorization' : header
                    }
                ).then( function(response) {
                    assert.fail('expected fail',response);
                }, function(e) {
                    assert.ok(e);
                    assert.equal(e.statusCode, 400);
                });
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
        });

    });

});