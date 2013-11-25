var assert = require('assert');
var q = require('q');

describe('jive', function () {

    describe('service events', function () {

        it('custom event', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var mockery = this['mockery'];
            var __testDataKey = testUtils.guid();
            var options = testUtils.createBaseServiceOptions('/services/samplesvc');
            options['__testDataKeyCustomSelfServiceEvent'] = __testDataKey;
            options['__testDataKey'] = __testDataKey;

            testUtils.setupService(jive, options).then( function() {
                return testUtils.waitSec(0.3);
            }).then( function() {
                var deferred = q.defer();
                var expectedData = testUtils.guid();
                jive.service.scheduler().schedule( 'customServiceEvent', {
                    'eventListener' : 'samplelist', 'customServiceEventData' : expectedData
                }).then( function( result) {
                    if ( result['customServiceEventData'] !== expectedData ) {
                        deferred.reject(['custom event did not fire', 'custom event fired']);
                    } else {
                        deferred.resolve();
                    }
                });
                return deferred.promise;
            }).then( function() {
                // test scheduled task -- make sure it fired at least once
                var _testDataValue = jive.service.options[__testDataKey];
                return !_testDataValue?
                    q.reject(['custom self service task did not fire', 'task fired']) : q.resolve();
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

        it('tile name different from tile dir', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var newInstance = testUtils.createExampleInstance();
            newInstance['name'] = 'differentname';

            testUtils.setupService(jive,
                testUtils.createBaseServiceOptions('/services/tile_name_different_from_dir')
            ).then( function() {
                jive.events.emit("newInstance", newInstance );
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

        it('tile name same as tile dir', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var newInstance = testUtils.createExampleInstance();
            newInstance['name'] = 'samplelist';

            testUtils.setupService(jive,
                testUtils.createBaseServiceOptions('/services/tile_name_same_as_dir')
            ).then( function() {
                jive.events.emit("newInstance", newInstance );
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

        it('global tile instance event matches no registered tile', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var newInstance = testUtils.createExampleInstance();
            newInstance['name'] = 'Xsamplelist';

            testUtils.setupService(jive,
                testUtils.createBaseServiceOptions('/services/tile_name_same_as_dir')
            ).then( function() {
                jive.events.emit("newInstance", newInstance );
                return testUtils.waitSec(0.3);
            }).then( function() {
                return jive.service.options['__testData'] ? q.reject() : q.resolve();
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

