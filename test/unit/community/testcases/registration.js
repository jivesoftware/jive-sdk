var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('community registration', function () {

        it('happy path', function (done) {
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
                            'path' : '/signature',
                            'body' : {}
                        },
                        {
                            'method' : 'post',
                            'statusCode' : '200',
                            'path' : '/oauth2/token',
                            'body' : expectedAccessToken
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/register', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://localhost:5556/signature',
                            'code' : testUtils.guid(),
                            'scope' : testUtils.guid(),
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'clientSecret' : testUtils.guid()
                        }
                    );
                }
            );
        });

        it('happy path - no token exchange', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.runServerTest(testUtils, jive, done,
                {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method' : 'post',
                            'statusCode' : '200',
                            'path' : '/signature',
                            'body' : {},
                            'handler' : function() {
                                // this is going to run on the remote server!
                                // if this fires, then we know that oauth token exchange
                                // happened unexpectedly
                                delete app.routes.put;
                                self.setEndpoint(
                                    'post',
                                    '/oauth2/token',
                                    '500',
                                    JSON.stringify({})
                                );
                            }
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/register', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://localhost:5556/signature',
                            'scope' : testUtils.guid(),
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'clientSecret' : testUtils.guid()
                        }
                    );
                }
            );
        });

        it('happy path - development mode', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.runServerTest(testUtils, jive, done,
                {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method' : 'post',
                            'statusCode' : '500',
                            'path' : '/signature',
                            'body' : {}
                        }
                    ],
                    'development' : true
                },
                function(testUtils, jive, community) {
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/register', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://XXXXXX.INVALID.XXXX.COM.XXXXXXX',
                            'scope' : testUtils.guid(),
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'clientSecret' : testUtils.guid()
                        }
                    );
                }
            );
        });

        it('failed registration - invalid signature', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.runServerTest(testUtils, jive, done,
                {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method' : 'post',
                            'statusCode' : '403',
                            'path' : '/signature',
                            'body' : {}
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/register', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://localhost:5556/signature',
                            'code' : testUtils.guid(),
                            'scope' : testUtils.guid(),
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'clientSecret' : testUtils.guid()
                        }
                    ).then(
                        function(r) {
                            assert.fail(r);
                        },

                        function(e) {
                            assert.ok(e);
                            assert.equal(e['statusCode'], 400);
                        }
                    );
                }
            );
        });


        it('failed registration - failed access token exchange', function (done) {
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
                            'path' : '/signature',
                            'body' : {},
                            'handler' : function() {
                                // this is going to run on the remote server!
                                delete app.routes.put;
                                self.setEndpoint(
                                    'post',
                                    '/oauth2/token',
                                    '500',
                                    JSON.stringify({})
                                );
                            }
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/register', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://localhost:5556/signature',
                            'code' : testUtils.guid(),
                            'scope' : testUtils.guid(),
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'clientSecret' : testUtils.guid()
                        }
                    ).then(
                        function(r) {
                            assert.fail(r);
                        },

                        function(e) {
                            assert.ok(e);
                            assert.equal(e['statusCode'], 400);
                        }
                    );
                }
            );
        });
    });

});