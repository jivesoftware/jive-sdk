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
            var mockery = this['mockery'];

            var serviceSrcPath = testUtils.getResourceFilePath('/services/extension_full');

            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return qiofs.copyTree(serviceSrcPath, extensionRoot ).then( function() {
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
                    });
                })
            }).then( function() {
                done();
            });
        });

        it('prepare - cartridges', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var mockery = this['mockery'];

            var serviceSrcPath = testUtils.getResourceFilePath('/services/extension_cartridge');

            testUtils.createTempDir().then( function(dir) {
                var extensionRoot = dir + '/extension';
                return qiofs.copyTree(serviceSrcPath, extensionRoot ).then( function() {
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
                    });
                })
            }).then( function() {
                done();
            });
        });
    });
});