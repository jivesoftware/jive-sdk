var assert = require('assert');
var q = require('q');
var tests = require('../baseSchedulerTest');

describe('jive', function () {

    describe('scheduler', function () {

        it('testSimpleSingleEvent', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSimpleSingleEvent(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSimpleSingleEventGlobalFireUntargeted', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSimpleSingleEventGlobalFireUntargeted(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSimpleSingleEventGlobalFireTargeted', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSimpleSingleEventGlobalFireTargeted(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSimpleSingleEventMixedFireUntargeted', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSimpleSingleEventMixedFireUntargeted(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSimpleSingleEventMixedFireTargeted', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSimpleSingleEventMixedFireTargeted(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSimpleIntervalEvent', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSimpleIntervalEvent(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSingleEventWithDelay', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSingleEventWithDelay(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testIntervalEventWithDelay', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testIntervalEventWithDelay(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testSingleEventTimeout', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testSingleEventTimeout(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testIntervalEventTimeout', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testIntervalEventTimeout(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testOverlappingIntervalEvents', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testOverlappingIntervalEvents(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testOverlappingSingleNonExclusiveEvent', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testOverlappingSingleNonExclusiveEvent(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testOverlappingSingleExclusiveEvent', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testOverlappingSingleExclusiveEvent(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testConcurrentIntervalEvents', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testConcurrentIntervalEvents(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });

        it('testFailedEvent', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var scheduler = jive.service.scheduler(new jive.scheduler.memory());
            tests.testFailedEvent(jive, testUtils, scheduler).then( function() {
                done();
            }, function() {
                assert.fail()
            }).finally( function() {
                scheduler.shutdown();
            });
        });


    });

});

