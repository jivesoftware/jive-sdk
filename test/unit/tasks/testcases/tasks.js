var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('tasks', function () {

        it('build', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            jive.context['persistence'] = new jive.persistence.memory();
            jive.context['scheduler'] = new jive.scheduler.memory();

            var id = testUtils.guid();
            var interval = 1000;
            var handler = function() {};
            var task = jive.tasks.build(handler, interval, id);

            assert.ok(task);
            assert.equal( task['id'], id );
            assert.equal( task['interval'], interval );
            assert.equal( task['handler'], handler );

            done();
        });

        it('build - failed, no handler', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            jive.context['persistence'] = new jive.persistence.memory();
            jive.context['scheduler'] = new jive.scheduler.memory();

            var id = testUtils.guid();
            var interval = 1000;
            try {
                jive.tasks.build(undefined, interval, id);
                assert.fail();
            } catch( e ) {
                assert.ok(e);
                done();
            }
        });

        it('schedule', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            jive.context['persistence'] = new jive.persistence.memory();
            var scheduler = new jive.scheduler.memory().init();
            jive.context['scheduler'] = scheduler;

            var id = testUtils.guid();
            var task = jive.tasks.build(function() {
                done();
            }, 100, id);

            jive.tasks.schedule( task, jive.context['scheduler']).then( function() {
                scheduler.shutdown();
            });
        });

        it('service with only task defined', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var newInstance = testUtils.createExampleInstance();
            newInstance['name'] = 'samplelist';

            testUtils.setupService(jive,
                    testUtils.createBaseServiceOptions('/services/tile_tasks')
                ).then( function() {
                    return testUtils.waitSec(0.3);
                }).then( function() {
                    return jive.service.options['__testData'] ? q.resolve() : q.reject();
                }).then(
                function() {
                    jive.service.stop().then( function() {
                        done();
                    });
                },
                function (e) {
                    jive.service.stop().then( function() {
                        assert.fail(e[0], e[1]);
                    });
                }
            );
        });


    });

});