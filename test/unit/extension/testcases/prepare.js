var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');
var qiofs = require('q-io/fs');
var sinon = require("sinon");

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
                        extensionRoot + '/storages',
                        extensionRoot + '/services'
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

                    assert.ok( definitionJson['jabCartridges'] === undefined );

                }).then( function() {
                    done();
                });
            });
        });

        function stubJiveLogger(jive, logs){
            function stubTemplate(log){
                function stringLog(m){
                    return m ?  typeof m === "object" ? JSON.stringify(m) : m : "";
                }
                sinon.stub(jive.logger, log, function(a,b){
                    logs[log].push(stringLog(a)+ stringLog(b));
                });
            }
            for(var log in logs){
                stubTemplate(log);
            }
            return function(){
                for(var log in logs){
                    jive.logger[log].restore();
                }
            }
        }

        function testForCartridgeZips(jive, extensionRoot, numberOfZips){
            return jive.util.fsreaddir(extensionRoot + '/extension_src/data').then(function (items) {
                var zips = items.filter(function (item) {
                    return item.indexOf(".zip") >= 0; // assume that this is a cartridge
                });

                assert.equal(zips.length, numberOfZips);
            });
        }

        it('prepare - cartridge is present and configured', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var warnings = [];
            var restore = stubJiveLogger(jive, {warn:warnings});
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
                        'role' : 'worker',
                        'extensionInfo':{
                            "type": "jab-cartridges-app"
                        }
                    });
                }).then( function(service) {
                    return jive.service.extensions().prepare(extensionRoot,
                        extensionRoot + '/tiles',
                        extensionRoot + '/apps',
                        extensionRoot + '/cartridges',
                        extensionRoot + '/storages',
                        extensionRoot + '/services'
                    ).then( function() {
                        return service.stop();
                    }).then( function() {
                        return extensionRoot;
                    });
                })
            }).then( function(extensionRoot) {
                // validate that extension.zip exists
                return jive.util.fsreadJson(extensionRoot + '/extension_src/definition.json')
                    .then(function (definitionJson) {
                        assert.ok(definitionJson);
                        assert.ok(definitionJson['jabCartridges']);
                        assert.equal(definitionJson['jabCartridges'].length, 4);
                        loggedAWarningForCartridge(warnings, false);
                    }).then(function () {
                        return testForCartridgeZips(jive, extensionRoot, 4);
                    });
            }).then( function() {
                restore();
                done();
            }).catch(function (error) {
                restore();
                throw error;
            });
        });


        function loggedAWarningForCartridge(warnings, flag) {
            assert.equal(warnings.indexOf('***********************\n' +
                'This add-on contains cartridges,  ' +
                'but it is not configured to package them. '+
                'To enable this, add "type": "jab-cartridges-app" ' +
                'to the extensionInfo field of jiveclientconfiguration.json\n' +
                '**********************') >= 0, flag);
        }

        it('prepare - ignore cartridge if it is not configured', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var warnings = [];
            var restore = stubJiveLogger(jive, {warn:warnings});
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
                                extensionRoot + '/storages',
                                extensionRoot + '/services'
                        ).then( function() {
                                return service.stop();
                            }).then( function() {
                                return extensionRoot;
                            });
                    })
            }).then( function(extensionRoot) {
                // validate that extension.zip exists
                return jive.util.fsreadJson( extensionRoot + '/extension_src/definition.json' )
                    .then( function(definitionJson) {
                        assert.ok(definitionJson);
                        assert.ok( definitionJson['jabCartridges'] === undefined );
                        loggedAWarningForCartridge(warnings, true);
                    }).then(function () {
                        return testForCartridgeZips(jive, extensionRoot, 0);
                    });
            }).then( function() {
                restore();
                done();
            }).catch(function (error) {
                restore();
                console.log(error);
                throw error;
            });
        });

        it('prepare - no cartridge and not configured', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var warnings = [];
            var restore = stubJiveLogger(jive, {warn:warnings});
            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return testUtils.setupService(jive, {
                    'svcRootDir': extensionRoot,
                    'persistence': 'memory',
                    'logLevel': 'FATAL',
                    'skipCreateExtension': true,
                    'clientUrl': testUtils.createFakeURL(),
                    'role': 'worker'
                })
                    .then(function (service) {
                        return jive.service.extensions().prepare(extensionRoot,
                                extensionRoot + '/tiles',
                                extensionRoot + '/apps',
                                extensionRoot + '/cartridges',
                                extensionRoot + '/storages',
                                extensionRoot + '/services'
                        ).then(function () {
                                return service.stop();
                            }).then(function () {
                                return extensionRoot;
                            });
                    })
            }).then( function(extensionRoot) {
                // validate that extension.zip exists
                return jive.util.fsreadJson( extensionRoot + '/extension_src/definition.json' )
                    .then( function(definitionJson) {
                        assert.ok( definitionJson );
                        assert.ok( definitionJson['jabCartridges'] === undefined );
                        loggedAWarningForCartridge(warnings, false);
                    }).then(function () {
                        return testForCartridgeZips(jive, extensionRoot, 0);
                    })
            }).then( function() {
                restore();
                done();
            }).catch(function (error) {
                restore();
                throw error;
            });
        });

        it('prepare - no cartridge and configured', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var warnings = [];
            var restore = stubJiveLogger(jive, {warn:warnings});
            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return testUtils.setupService(jive, {
                    'svcRootDir': extensionRoot,
                    'persistence': 'memory',
                    'logLevel': 'FATAL',
                    'skipCreateExtension': true,
                    'clientUrl': testUtils.createFakeURL(),
                    'role': 'worker',
                    'extensionInfo':{
                        "type": "jab-cartridges-app"
                    }
                })
                    .then(function (service) {
                        return jive.service.extensions().prepare(extensionRoot,
                                extensionRoot + '/tiles',
                                extensionRoot + '/apps',
                                extensionRoot + '/cartridges',
                                extensionRoot + '/storages',
                                extensionRoot + '/services'
                        ).then(function () {
                                return service.stop();
                            }).then(function () {
                                return extensionRoot;
                            });
                    })
            }).then( function(extensionRoot) {
                // validate that extension.zip exists
                return jive.util.fsreadJson( extensionRoot + '/extension_src/definition.json' )
                    .then( function(definitionJson) {
                        assert.ok( definitionJson );
                        assert.ok( definitionJson['jabCartridges'] === undefined );
                        loggedAWarningForCartridge(warnings, false);
                    }).then(function () {
                        return testForCartridgeZips(jive, extensionRoot, 0);
                    })
            }).then( function() {
                restore();
                done();
            }).catch(function (error) {
                restore();
                throw error;
            });
        });

    });
});