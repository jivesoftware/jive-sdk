var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('community unregistration', function () {

        it('happy path', function (done) {
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
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/unregister', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://localhost:5556/signature',
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'uninstalled': true,
                            'timestamp': "2014-03-11T23:04:11.230+0000"
                        }
                    ).then(function() {
                        return jive.community.findByJiveURL('http://localhost:5556').then(function(community) {
                            if (community) {
                               assert.fail("community not removed");
                            }
                        });
                    }, function(r) {
                        assert.fail(r);
                    });
                }
            );
        });

        it('failed unregistration - no community', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.runServerTest(testUtils, jive, done, {
                'port' : 5556,
                'routes' : [{
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
                }]},
                function(testUtils, jive, community) {
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/unregister', 'POST',{
                        'jiveSignature' : '123',
                        'jiveSignatureURL' : 'http://localhost:5556/signature',
                        'tenantId' : testUtils.guid(),
                        'jiveUrl' : 'http://invalid:5556',
                        'clientId' : testUtils.guid(),
                        'uninstalled': true,
                        'timestamp': "2014-03-11T23:04:11.230+0000"
                    }).then(function() {
                        assert.fail();
                    }, function(e) {
                        assert.equal(e['statusCode'], 400);
                        return jive.community.findByJiveURL('http://localhost:5556').then(function(community) {
                            if (!community) {
                                assert.fail("community  removed");
                            }
                        });
                    });
                });
        });

        it('failed unregistration - invalid signature', function (done) {
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
                    return jive.util.buildRequest( 'http://localhost:5555/jive/oauth/unregister', 'POST',
                        {
                            'jiveSignature' : '123',
                            'jiveSignatureURL' : 'http://localhost:5556/signature',
                            'tenantId' : testUtils.guid(),
                            'jiveUrl' : 'http://localhost:5556',
                            'clientId' : testUtils.guid(),
                            'uninstalled': true,
                            'timestamp': "2014-03-11T23:04:11.230+0000"
                        }
                    ).then(
                        function(r) {
                            assert.fail(r);
                        },

                        function(e) {
                            assert.ok(e);
                            assert.equal(e['statusCode'], 400);
                            return jive.community.findByJiveURL('http://localhost:5556').then(function(community) {
                                if (!community) {
                                    assert.fail("community  removed");
                                }
                            });
                        }
                    );
                }
            );
        });

    });

});