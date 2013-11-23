var assert = require('assert');
var q = require('q');

describe('jive', function () {

    describe('service setup', function () {

        it('happy path', function (done) {

            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var __testDataKey = testUtils.guid();
            var options = testUtils.createBaseServiceOptions('/services/samplesvc');
            options['__testDataKey'] = __testDataKey;

            testUtils.setupService(jive, options).then( function() {
                return testUtils.waitSec(0.3);
            }).then( function() {
                var p = q.defer();
                // test tiles
                jive.tiles.definitions.findAll().then( function(found) {
                    if ( !found || found.length < 1 || found.length > 1) {
                        p.reject();
                    }
                }).then( function() {
                    // test scheduled task -- make sure it fired at least once
                    var _testDataValue = jive.service.options[__testDataKey];
                    if ( !_testDataValue ) {
                        p.reject(['task did not fire', 'task fired']);
                    } else {
                        p.resolve();
                    }
                });
                return p.promise;
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

        it('bad persistence', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var mockery = this['mockery'];

            testUtils.setupService(jive, {
                'svcRootDir' : testUtils.getResourceFilePath('/services/samplesvc'),
                'persistence' : {}, 'logLevel': 'FATAL', 'role' : 'worker'
            }).then(
                function() {
                    assert.fail();
                }, function(e) {
                    done();
                }
            );

        });

        it('bad scheduler', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var mockery = this['mockery'];

            testUtils.setupService(jive, {
                'svcRootDir' : testUtils.getResourceFilePath('/services/samplesvc'),
                'persistence' : 'memory', 'scheduler': {}, 'logLevel': 'FATAL', 'role' : 'worker'
            }).then(
                function() {
                    assert.fail();
                }, function(e) {
                    done();
                }
            );

        });

    });

});

