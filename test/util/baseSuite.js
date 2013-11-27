var Mocha = require('mocha');
var fs = require('fs');
var q = require('q');
var path = require('path');
var testUtils = require('./testUtils');

exports.getTestDir = function() {
    // overridden
};

exports.beforeTest = function() {
    // overridden
};

exports.onTestPass = function(test) {
    // overridden
};

exports.onTestFail = function(test) {
    // overridden
};

exports.onTestStart = function(test) {
};

exports.setupSuite = function(test) {
    // overridden
};

exports.teardownSuite = function(test) {
    // overridden
};

exports.allClear = true;
exports.context = {};

exports.runTests = function(options) {
    var deferred = q.defer();

    exports.context = options['context'];

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
            that.allClear = false;
            that.onTestFail(test);
        });

    });

    return deferred.promise;
};

