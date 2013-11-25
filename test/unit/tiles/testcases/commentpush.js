var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('comment', function () {

        it('push on activity', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'post',
                            'statusCode'    : '200',
                            'path'          : '/extstreams/1/comments',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var externalStreamInstance = testUtils.createExampleInstance(community['jiveCommunity'], 'sampleactivity',
                        community['jiveUrl'] + '/extstreams/1/activities');

                    return jive.extstreams.save(externalStreamInstance).then(function (instance ) {

                        var activity = testUtils.createExampleJiveActivity(community['jiveUrl'] + '/extstreams/1' );
                        var comment = testUtils.createExampleComment(testUtils.guid());

                        return jive.service.scheduler().schedule('commentOnActivity', {
                            'activity' : activity,
                            'comment' : comment
                        });
                    }).then(
                        function(r) {
                            assert.ok(r);
                        },
                        function(e) {
                            assert.fail();
                        }
                    );
                },
                '/services/tile_activity_push');
        });

        it('push on activity by externalActivityID', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'post',
                            'statusCode'    : '200',
                            'path'          : '/extstreams/1/extactivities/externalActivity100/comments',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var externalStreamInstance = testUtils.createExampleInstance(community['jiveCommunity'], 'sampleactivity',
                        community['jiveUrl'] + '/extstreams/1/activities');

                    return jive.extstreams.save(externalStreamInstance).then(function (instance ) {

                        var comment = testUtils.createExampleComment(testUtils.guid());

                        return jive.service.scheduler().schedule('commentOnActivityByExternalID', {
                            'extstream' : externalStreamInstance,
                            'externalActivityID' : 'externalActivity100',
                            'comment' : comment
                        });
                    }).then(
                        function(r) {
                            assert.ok(r);
                        },
                        function(e) {
                            assert.fail(e);
                        }
                    );
                },
                '/services/tile_activity_push');
        });

        it('pull all for activity', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var commentList = [];
            for ( var i = 0; i < 25; i++ ) {
                var comment = testUtils.createExampleComment();
                commentList.push(comment);
            }

            var expectedDatapushEntity = {
                'list' : commentList,
                'links' : {
                    'next' : 'http://localhost:5556/extstreams/1/comments/next'
                }
            };

            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'get',
                            'statusCode'    : '200',
                            'path'          : '/extstreams/1/comments',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var externalStreamInstance = testUtils.createExampleInstance(community['jiveCommunity'], 'sampleactivity',
                        community['jiveUrl'] + '/extstreams/1/activities');

                    return jive.extstreams.save(externalStreamInstance).then(function (instance ) {

                        return jive.service.scheduler().schedule('fetchCommentsOnActivity', {
                            'activity' : testUtils.createExampleJiveActivity(community['jiveUrl'] + '/extstreams/1' ),
                            'opts' : {}
                        });
                    }).then(
                        function(r) {
                            assert.ok(r);
                            assert.ok(r['entity']);
                            assert.ok(r['entity']['list']);
                            assert.ok(r['entity']['links']);
                            assert.ok(r['entity']['links']['next']);
                            assert.equal(r['entity']['list'].length, 25);
                        },
                        function(e) {
                            assert.fail(e);
                        }
                    );
                },
                '/services/tile_activity_push');
        });

        it('pull all for extstream instance', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var commentList = [];
            for ( var i = 0; i < 25; i++ ) {
                var comment = testUtils.createExampleComment();
                commentList.push(comment);
            }

            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'get',
                            'statusCode'    : '200',
                            'path'          : '/extstreams/1/comments',
                            'body'          : { 'list': commentList }
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var externalStreamInstance = testUtils.createExampleInstance(community['jiveCommunity'], 'sampleactivity',
                        community['jiveUrl'] + '/extstreams/1/activities');

                    return jive.extstreams.save(externalStreamInstance).then(function (instance ) {

                        return jive.service.scheduler().schedule('fetchAllCommentsForExtstream', {
                            'extstream' : externalStreamInstance,
                            'opts' : {}
                        });
                    }).then(
                        function(r) {
                            assert.ok(r);
                            assert.ok(r['entity']);
                            assert.ok(r['entity']['list']);
                            assert.equal(r['entity']['list'].length, 25);
                        },
                        function(e) {
                            assert.fail(e);
                        }
                    );
                },
                '/services/tile_activity_push');
        });

        it('pull all JIVE for activity', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var commentList = [];
            for ( var i = 0; i < 25; i++ ) {
                var comment = testUtils.createExampleComment( i > 5 && i <= 10  ? testUtils.guid() : undefined );
                commentList.push(comment);
            }

            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'get',
                            'statusCode'    : '200',
                            'path'          : '/extstreams/1/comments',
                            'body'          : { 'list': commentList }
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var externalStreamInstance = testUtils.createExampleInstance(community['jiveCommunity'], 'sampleactivity',
                        community['jiveUrl'] + '/extstreams/1/activities');

                    return jive.extstreams.save(externalStreamInstance).then(function (instance ) {
                        return jive.service.scheduler().schedule('fetchCommentsOnActivity', {
                            'activity' : testUtils.createExampleJiveActivity(community['jiveUrl'] + '/extstreams/1' ),
                            'opts' : { 'commentSourceType' : 'JIVE' }
                        });
                    }).then(
                        function(r) {
                            assert.ok(r);
                            assert.ok(r['entity']);
                            assert.ok(r['entity']['list']);
                            assert.equal(r['entity']['list'].length, 20);
                        },
                        function(e) {
                            assert.fail(e);
                        }
                    );
                },
                '/services/tile_activity_push');
        });

        it('pull all EXTERNAL for activity', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var commentList = [];
            for ( var i = 0; i < 25; i++ ) {
                var comment = testUtils.createExampleComment( i > 5 && i <= 10  ? testUtils.guid() : undefined );
                commentList.push(comment);
            }

            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'get',
                            'statusCode'    : '200',
                            'path'          : '/extstreams/1/comments',
                            'body'          : { 'list': commentList }
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var externalStreamInstance = testUtils.createExampleInstance(community['jiveCommunity'], 'sampleactivity',
                        community['jiveUrl'] + '/extstreams/1/activities');

                    return jive.extstreams.save(externalStreamInstance).then(function (instance ) {
                        return jive.service.scheduler().schedule('fetchCommentsOnActivity', {
                            'activity' : testUtils.createExampleJiveActivity(community['jiveUrl'] + '/extstreams/1' ),
                            'opts' : { 'commentSourceType' : 'EXTERNAL' }
                        });
                    }).then(
                        function(r) {
                            assert.ok(r);
                            assert.ok(r['entity']);
                            assert.ok(r['entity']['list']);
                            assert.equal(r['entity']['list'].length, 5);
                        },
                        function(e) {
                            assert.fail(e);
                        }
                    );
                },
                '/services/tile_activity_push');
        });

    });
});