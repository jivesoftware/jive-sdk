var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('webhooks', function () {

        it('save', function (done) {
            var jive = this['jive'];

            jive.context['persistence'] = new jive.persistence.memory();

            var webhook = {
                'url' : 'http://localhost:5555/webhook'
            };
            jive.webhooks.save( webhook).then(
                function(saved) {
                    // ok
                    done();
                },

                function(e) {
                    assert.fail(e);
                }
            );
        });


        it('register', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'post',
                            'statusCode'    : '200',
                            'path'          : '/api/core/v3/webhooks',
                            'body'          : expectedDatapushEntity,
                            'handler'       : function(req, res, body) {
                                if ( req.headers['authorization'] !== 'Bearer __authorization_header__' ) {
                                    res.writeHead(500, {} );
                                    res.end('bad authorization header');
                                    return true;
                                }

                                if ( req.body['events'] !== 'documents' ) {
                                    res.writeHead(500, {} );
                                    res.end('bad events');
                                    return true;
                                }

                                if ( req.body['object'] !== 'http://localhost:5556/api/core/v3/places/1000' ) {
                                    res.writeHead(500, {} );
                                    res.end('bad object');
                                    return true;
                                }
                            }
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    var p = q.defer();
                    jive.webhooks.register(
                        'localhost:5556',
                        'documents',
                        'http://localhost:5556/api/core/v3/places/1000',
                        'http://localhost:5555/webhooks',
                        '__authorization_header__'
                    ).then(
                        function(r) {
                            p.resolve(r);
                        },

                        function(e) {
                            p.reject(e);
                        }
                    );

                    return p.promise;
                },
                '/services/tile_activity_push');
        });

        it('register failed - no community', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'post',
                            'statusCode'    : '200',
                            'path'          : '/api/core/v3/webhooks',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    var p = q.defer();
                    jive.webhooks.register(
                        'localhostX:5556',
                        'documents',
                        'http://localhost:5556/api/core/v3/places/1000',
                        'http://localhost:5555/webhooks',
                        '__authorization_header__'
                    ).then(
                        function(r) {
                            p.reject('Expected error');
                        },

                        function(e) {
                            p.resolve();
                        }
                    );

                    return p.promise;
                },
                '/services/tile_activity_push');
        });

        it('register failed - no access token', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'post',
                            'statusCode'    : '200',
                            'path'          : '/api/core/v3/webhooks',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {
                    var p = q.defer();
                    delete community['oauth'];
                    jive.webhooks.register(
                        'localhost:5556',
                        'documents',
                        'http://localhost:5556/api/core/v3/places/1000',
                        'http://localhost:5555/webhooks'
                    ).then(
                        function(r) {
                            p.reject('Expected error');
                        },

                        function(e) {
                            p.resolve();
                        }
                    );

                    return p.promise;
                },
                '/services/tile_activity_push');
        });

    });

});