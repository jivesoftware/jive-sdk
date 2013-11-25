var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('tiles registration', function () {

        it('happy path - save', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.runServerTest(testUtils, jive, done,
                {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method' : 'post',
                            'statusCode' : '200',
                            'path' : '/oauth2/token',
                            'body' : expectedAccessToken
                        }
                    ]
                },
                function(testUtils, jive, community) {
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
                }
             );
        });

        it('happy path - update', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.runServerTest(testUtils, jive, done, undefined,
                function(testUtils, jive, community) {

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist').then( function(instance) {

                        // do some tests
                        var header = testUtils.createAuthorizationHeader(community);
                        return jive.util.buildRequest('http://localhost:5555/registration', 'POST',
                            // body
                            {
                                'guid'          :   instance['guid'],
                                'remoteID'      :   instance['id'],
                                'config'        :   { 'my' : 'updatedconfig' },
                                'name'          :   instance['name'],
                                'jiveUrl'       :   community['jiveUrl'],
                                'tenantID'      :   community['tenantId'],
                                'pushUrl'       :   instance['url']
                            },

                            // headers
                            {
                                'Authorization' : header
                            }
                        ).then( function(response) {
                            assert.ok(response);
                            assert.ok(response['entity']);
                            assert.equal( response['entity']['config']['my'], 'updatedconfig' );
                            assert.equal( response['entity']['guid'], instance['guid'] );
                        }, function(e) {
                            assert.fail(e, 'instance');
                        });

                    });
                }
            );
        });

        it('unrecognized tile name', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.runServerTest(testUtils, jive, done, undefined,
                function(testUtils, jive, community) {
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
                }
            );
        });

        it('jive rejects access token request', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.runServerTest(testUtils, jive, done,
                {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method' : 'post',
                            'statusCode' : '500',
                            'path' : '/oauth2/token',
                            'body' : expectedAccessToken
                        }
                    ]
                },
                function(testUtils, jive, community) {
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
                            assert.fail('expected fail',response);
                        }, function(e) {
                            assert.ok(e);
                            assert.equal(e.statusCode, 500);
                        });
                }
            );
        });

        it('jive unregisters tile instance', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.runServerTest(testUtils, jive, done, undefined,
                function(testUtils, jive, community) {
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
                        return response['entity'];
                    }, function(e) {
                        assert.fail('registration request failed');
                    }).then( function(instance) {

                        return jive.util.buildRequest('http://localhost:5555/unregister', 'POST',
                            // body
                            {
                                'guid'          :   instance['guid'],
                                'name'          :   instance['name'],
                                'tenantID'      :   community['tenantId']
                            },

                            // headers
                            {
                                'Authorization' : header
                            }
                        ).then(
                            function(response) {
                                assert.equal(response['statusCode'], 204);
                                return response['entity'];
                            },
                            function(e) {
                                assert.fail('registration request failed');
                            }
                        );
                    });
                }
            );
        });

        it('jive unregisters unknown tile instance', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedAccessToken = {
                'access_token' : testUtils.guid(),
                'expiresIn' : new Date().getTime(),
                'refreshToken' : testUtils.guid()
            };

            testUtils.runServerTest(testUtils, jive, done, undefined,
                function(testUtils, jive, community) {
                    // do some tests
                    var header = testUtils.createAuthorizationHeader(community);
                    return jive.util.buildRequest('http://localhost:5555/unregister', 'POST',
                        // body
                        {
                            'guid'          :   testUtils.guid(),
                            'name'          :   'samplelist',
                            'tenantID'      :   community['tenantId']
                        },

                        // headers
                        {
                            'Authorization' : header
                        }
                    ).then(
                        function(response) {
                            assert.fail(response['statusCode'], 404);
                        },
                        function(e) {
                            assert.equal(e['statusCode'], 404);
                        }
                    );
                }
            );
        });

    });

});