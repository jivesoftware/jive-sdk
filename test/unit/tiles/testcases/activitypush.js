var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('tiles activity push', function () {

        it('happy path', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var expectedDatapushEntity = { 'my': 'entity' };
            testUtils.runServerTest(testUtils, jive, done, {
                    'port' : 5556,
                    'routes' : [
                        {
                            'method'        : 'post',
                            'statusCode'    : '200',
                            'path'          : '/activityPush',
                            'body'          : expectedDatapushEntity
                        }
                    ]
                },
                function(testUtils, jive, community) {

                    var pushUrl = community['jiveUrl'] + '/activityPush';

                    return testUtils.persistExampleInstances(jive, 1, community['jiveCommunity'], 'sampleactivity', pushUrl)
                        .then( function(instance) {

                            return jive.service.scheduler().schedule('pushMeActivity', {
                                'eventListener' : 'sampleactivity',
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
                '/services/tile_activity_push');
        });

    });
});