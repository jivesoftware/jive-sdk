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

        it('specify config file location, role', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            process.env['jive_sdk_config_file'] = testUtils.getResourceFilePath('/services/tile_simple/config.json');
            process.env['jive_sdk_service_role'] = 'worker';

            testUtils.setupService(jive, undefined).then( function() {
                return testUtils.waitSec(0.3);
            }).then(
                function() {
                    var p = q.defer();
                    if ( jive.service.options['xyz'] == '123' && jive.service.options['role'] == 'worker' ) {
                        p.resolve();
                    } else {
                        p.reject(new Error("Failed to resolve configuration file"));
                    }

                    return p.promise;
                },

                function(e) {
                    return q.reject(e);
                }

            ).then(
                function() {
                    jive.service.stop().then( function() {
                        delete process.env['jive_sdk_config_file'];
                        delete process.env['jive_sdk_service_role'];
                        done();
                    });
                },
                function (e) {
                    jive.service.stop().then( function() {
                        delete process.env['jive_sdk_config_file'];
                        delete process.env['jive_sdk_service_role'];
                        console.log('e is', e);
                        assert.fail(e[0], e[1]);
                    });
                }
            );
        });

        it('specify envvars in config', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            process.env['jive_sdk_config_file'] = testUtils.getResourceFilePath('/setup/envvars.json');
            process.env['PORT'] = '1234';
            process.env['EXT_NAME'] = 'testing';
            process.env['DB_URI'] = 'mongodb://user:password@localhost/db';

            testUtils.setupService(jive, undefined).then( function() {
                return testUtils.waitSec(0.3);
            }).then(
                function() {
                    var p = q.defer();

                    assert.equal(jive.service.options['port'], '1234');
                    assert.equal(jive.service.options['databaseUrl'], 'mongodb://user:password@localhost/db');
                    assert.equal(jive.service.options['extensionInfo'].name, 'testing');

                    p.resolve();

                    return p.promise;
                },

                function(e) {
                    return q.reject(e);
                }

            ).then(
                function() {
                    jive.service.stop().then( function() {
                        delete process.env['PORT'];
                        delete process.env['EXT_NAME'];
                        delete process.env['DB_URI'];
                        done();
                    });
                },
                function (e) {
                    jive.service.stop().then( function() {
                        delete process.env['PORT'];
                        delete process.env['EXT_NAME'];
                        delete process.env['DB_URI'];
                        done(new Error(JSON.stringify(e)));
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

