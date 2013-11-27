var Mocha = require('mocha');
var fs = require('fs');
var q = require('q');
var path = require('path');
var mockery = require('mockery');
var testUtils = require('./testUtils');

exports.getTestDir = function() {
    // overridden
};

var cleanup = function() {
    mockery.resetCache();
};

exports.beforeTest = function() {
    // overridden
    mockery.enable();
};

exports.onTestPass = function(test) {
    cleanup();
};

exports.onTestFail = function(test) {
    exports.allClear = false;
    cleanup();
};

exports.onTestStart = function(test) {
};

exports.setupSuite = function(test) {
    test['testUtils'] = testUtils;
    test['jive'] = exports.jive;
    test['mockery'] = mockery;

    mockery.registerMock('jive-sdk', exports.jive);

    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
};

exports.jive = {};

exports.teardownSuite = function(test) {
    mockery.deregisterAll();
    mockery.disable();
};

exports.allClear = true;

exports.runTests = function(options) {
    var deferred = q.defer();

    exports.jive = options['jive'];

    var mochaOptions = {
        reporter: 'dot',
        ui: 'bdd',
        timeout: options['timeout'] || 10000
    };

    var suppressMessages;
    if ( options['runMode'] == 'coverage' ) {
        mochaOptions['reporter'] = 'html-cov';
        suppressMessages = true;
    } else {
        mochaOptions['reporter'] = 'list';
    }

    var mocha = new Mocha(mochaOptions);
    var that = this;
    var testDir = options['testcases'] || exports.getTestDir();

    testUtils.recursiveDirectoryProcessor( testDir, testDir, testDir, true, function(type, file) {
        if (path.extname(file) === '.js') {
            mocha.addFile(file);
        }
        return q.resolve();
    }).then( function() {

        var runner = mocha.run(function () {
            that.beforeTest();
        });

        runner.on('suite', function (test) {
            if ( test['title'] == that.getParentSuiteName() ) {
                that.setupSuite( test['ctx']);
            }
        });

        runner.on('suite end', function (test) {
            if ( test['title'] == that.getParentSuiteName() ) {
                that.teardownSuite(test);
            }
        });

        runner.on('end', function (test) {
            deferred.resolve(exports.allClear);
        });

        runner.on('test', function (test) {
            that.onTestStart(test);
        });

        runner.on('pass', function (test) {
            that.onTestPass(test);
        });

        runner.on('fail', function (test) {
            that.onTestFail(test);
        });

    });

    return deferred.promise;
};

