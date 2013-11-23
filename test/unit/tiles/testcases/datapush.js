var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('tiles data push', function () {

        it('happy path', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'put',
                            'statusCode'    : '200',
                            'path'          : '/datapush',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.ok(response);
                                assert.ok(response['entity']);
                                assert.equal(response['statusCode'], 200);
                                assert.equal( response['entity']['my'], expectedDatapushEntity['my']);
                            },
                            function(e) {
                                assert.fail(e);
                            }
                        );
                    });
                },
                '/services/tile_simple_datapush');
        });

        it('failed datapush - 500 reply', function (done) {
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, this['jive'], done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'put',
                            'statusCode'    : '500',
                            'path'          : '/datapush',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.fail( response );
                            },
                            function(e) {
                                assert.ok(e);
                                assert.equal(e['statusCode'], 500);
                                assert.equal( e['entity']['my'], expectedDatapushEntity['my']);
                            }
                        );
                    });
                },
                '/services/tile_simple_datapush');
        });

       it('failed datapush - no path', function (done) {
            var testUtils = this['testUtils'];

            testUtils.runServerTest(testUtils, this['jive'], done, {
                    'port' : 5556,
                    'routes' : [
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.fail( response );
                            },
                            function(e) {
                                assert.ok(e);
                                assert.equal(e['statusCode'], 404);
                            }
                        );
                    });
                },
                '/services/tile_simple_datapush');
        });

       it('failed datapush - 400 (bad request)', function (done) {
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, this['jive'], done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'put',
                            'statusCode'    : '400',
                            'path'          : '/datapush',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.fail( response );
                            },
                            function(e) {
                                assert.ok(e);
                                assert.equal(e['statusCode'], 400);
                                assert.equal( e['entity']['my'], expectedDatapushEntity['my']);
                            }
                        );
                    });
                },
                '/services/tile_simple_datapush');
        });

       it('failed datapush - 403 (refresh token flow)', function (done) {
            var testUtils = this['testUtils'];

           var expectedAccessToken = {
               'access_token' : testUtils.guid(),
               'expiresIn' : new Date().getTime(),
               'refreshToken' : testUtils.guid()
           };

           var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, this['jive'], done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'put',
                            'statusCode'    : '403',
                            'path'          : '/datapush',
                            'body'          : expectedDatapushEntity
                        },
                        {
                            'method' : 'post',
                            'statusCode' : '200',
                            'path' : '/oauth2/token',
                            'body' : expectedAccessToken,
                            'handler' : function() {
                                // this is going to run on the remote server!
                                delete app.routes.put;
                                self.setEndpoint(
                                    'put',
                                    '/datapush',
                                    '200',
                                    JSON.stringify({ 'ok' : 'now'})
                                );
                            }
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.ok( response );
                                assert.ok( response['entity']);
                                assert.equal( response['entity']['ok'], 'now');
                            },
                            function(e) {
                                assert.fail( e );
                            }
                        );
                    });
                },
                '/services/tile_simple_datapush');
        });

       it('failed datapush - failed refresh token flow', function (done) {
            var testUtils = this['testUtils'];

           var expectedAccessToken = {
               'access_token' : testUtils.guid(),
               'expiresIn' : new Date().getTime(),
               'refreshToken' : testUtils.guid()
           };

           var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, this['jive'], done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'put',
                            'statusCode'    : '403',
                            'path'          : '/datapush',
                            'body'          : expectedDatapushEntity
                        },
                        {
                            'method' : 'post',
                            'statusCode' : '403',
                            'path' : '/oauth2/token',
                            'body' : expectedAccessToken
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.fail( response );
                            },
                            function(e) {
                                assert.ok(e);
                                assert.equal(e['statusCode'], 403);
                            }
                        );
                    });
                },
                '/services/tile_simple_datapush');
        });

       it('failed datapush - 410 (gone)', function (done) {
            var testUtils = this['testUtils'];

           var expectedAccessToken = {
               'access_token' : testUtils.guid(),
               'expiresIn' : new Date().getTime(),
               'refreshToken' : testUtils.guid()
           };

            testUtils.runServerTest(testUtils, this['jive'], done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'put',
                            'statusCode'    : '410',
                            'path'          : '/datapush',
                            'body'          : {}
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/datapush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'samplelist', pushUrl)
                    .then( function(instance) {

                        return jive.service.scheduler().schedule('pushMeData', {
                            'eventListener' : 'samplelist',
                            'instance' : instance
                        }).then(
                            function(response) {
                                assert.fail( response );
                            },
                            function(e) {
                                assert.ok(e);
                                assert.equal(e['statusCode'], 410);
                            }
                        ).then( function() {
                            return jive.tiles.findByID(instance['id']).then( function(found) {
                                if ( found ) {
                                    assert.fail();
                                } else {
                                    return q.resolve();
                                }
                            });
                        });
                    });
                },
                '/services/tile_simple_datapush');
        });


    });

});