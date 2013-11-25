var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');
var qiofs = require('q-io/fs');

describe('jive', function () {
    describe('extension', function () {

        it('prepare', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return qiofs.copyTree(testUtils.getResourceFilePath('/services/extension_full'),
                        extensionRoot ).then( function() {
                    return testUtils.setupService(jive,{
                        'svcRootDir' : extensionRoot,
                        'persistence' : 'memory',
                        'logLevel' : 'FATAL',
                        'skipCreateExtension' : true,
                        'clientUrl' : testUtils.createFakeURL(),
                        'role' : 'worker'
                    });
                }).then( function(service) {
                    return jive.service.extensions().prepare(extensionRoot,
                        extensionRoot + '/tiles',
                        extensionRoot + '/apps',
                        extensionRoot + '/cartridges',
                        extensionRoot + '/storages'
                    ).then( function() {
                        return service.stop();
                    }).then( function() {
                        return extensionRoot;
                    });
                });
            }).then( function(extensionRoot) {
                // validate that extension.zip exists
                jive.util.fsexists( extensionRoot + '/extension.zip').then( function( exists ) {
                    assert.ok(exists);
                    return jive.util.fsexists( extensionRoot + '/extension_src');
                }).then( function(exists) {
                    assert.ok(exists);
                    return jive.util.fsexists( extensionRoot + '/extension_src/definition.json');
                }).then( function(exists) {
                    assert.ok(exists);
                    return jive.util.fsexists( extensionRoot + '/extension_src/meta.json');
                }).then( function(exists) {
                    assert.ok(exists);
                    return jive.util.fsreadJson( extensionRoot + '/extension_src/definition.json' );
                }).then( function(definitionJson) {
                    assert.ok( definitionJson );
                    assert.ok( definitionJson['tiles'] );
                    assert.equal( definitionJson['tiles'].length, 2 );

                    assert.ok( definitionJson['templates'] );
                    assert.equal( definitionJson['templates'].length, 1 );

                    assert.ok( definitionJson['osapps'] );
                    assert.equal( definitionJson['osapps'].length, 1 );

                    assert.ok( definitionJson['storageDefinitions'] );
                    assert.equal( definitionJson['storageDefinitions'].length, 1 );

                    assert.ok( definitionJson['jabCartridges'] );
                    assert.equal( definitionJson['jabCartridges'].length, 0 );

                }).then( function() {
                    done();
                });
            });
        });

        it('prepare - cartridges', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return qiofs.copyTree(testUtils.getResourceFilePath('/services/extension_cartridge'),
                        extensionRoot ).then( function() {
                    return testUtils.setupService(jive,{
                        'svcRootDir' : extensionRoot,
                        'persistence' : 'memory',
                        'logLevel' : 'FATAL',
                        'skipCreateExtension' : true,
                        'clientUrl' : testUtils.createFakeURL(),
                        'role' : 'worker'
                    });
                }).then( function(service) {
                    return jive.service.extensions().prepare(extensionRoot,
                        extensionRoot + '/tiles',
                        extensionRoot + '/apps',
                        extensionRoot + '/cartridges',
                        extensionRoot + '/storages'
                    ).then( function() {
                        return service.stop();
                    }).then( function() {
                        return extensionRoot;
                    });
                })
            }).then( function(extensionRoot) {
                // validate that extension.zip exists
                return jive.util.fsreadJson( extensionRoot + '/extension_src/definition.json' );
            }).then( function(definitionJson) {
                assert.ok( definitionJson );
                assert.ok( definitionJson['jabCartridges'] );
                assert.equal( definitionJson['jabCartridges'].length, 4  );
            }).then( function() {
                done();
            });
        });

        it('prepare - error (mixing cartridges with tiles)', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return qiofs.copyTree(testUtils.getResourceFilePath('/services/extension_error_mixed_cartridge'),
                        extensionRoot ).then( function() {
                    return testUtils.setupService(jive,{
                        'svcRootDir' : extensionRoot,
                        'persistence' : 'memory',
                        'logLevel' : 'FATAL',
                        'skipCreateExtension' : true,
                        'clientUrl' : testUtils.createFakeURL(),
                        'role' : 'worker'
                    });
                }).then( function(service) {
                    return jive.service.extensions().prepare(extensionRoot,
                        extensionRoot + '/tiles',
                        extensionRoot + '/apps',
                        extensionRoot + '/cartridges',
                        extensionRoot + '/storages'
                    ).then(
                        function(r) {
                            assert.fail();
                            return service.stop().then( function() {
                                done();
                            });
                        },
                        function(e) {
                            assert.ok(e);
                            return service.stop().then( function() {
                                done();
                            });
                        }
                    );
                })
            });
        });

    });
});