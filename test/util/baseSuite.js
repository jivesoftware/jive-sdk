var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var jive = require('../../jive-sdk-service/api.js');
var mockery = require('mockery');

exports.getTestDir = function() {
    // overridden
};

exports.beforeTest = function() {
    // overridden
    mockery.enable();
};

exports.onTestPass = function(test) {
};

exports.onTestFail = function(test) {
};

exports.setupSuite = function(test) {
    test['jive'] = jive;
    test['mockery'] = mockery;

    mockery.enable();
};

exports.teardownSuite = function(test) {
    mockery.disable();
};

exports.runTests = function() {

    var mocha = new Mocha({
        reporter: 'dot',
        ui: 'bdd',
        timeout: 10000
    });

    var that = this;
    var testDir = that.getTestDir();

    var tests = [];

    fs.readdir(testDir, function (err, files) {
        if (err) {
            console.log(err);
            return;
        }
        files.forEach(function (file) {
            if (path.extname(file) === '.js') {
                console.log('adding test file: %s', file);
                var test = mocha.addFile(testDir + file);
            }
        });

        var runner = mocha.run(function () {
            that.beforeTest();
        });

        runner.on('suite', function (test) {
            if ( test['title'] == that.getParentSuiteName() ) {
                console.log('start');
                that.setupSuite( test['ctx']);
            }
        });

        runner.on('suite end', function (test) {
            if ( test['title'] == that.getParentSuiteName() ) {
                that.teardownSuite(test);
            }
        });

        runner.on('test', function (test) {
        });

        runner.on('pass', function (test) {
            console.log('...Test "%s" passed', test.title);
            that.onTestPass(test);
        });

        runner.on('fail', function (test) {
            console.log('...Test "%s" failed', test.title);
            if (test.err && (test.err.expected || test.err.actual) ) {
                console.log('Expected: \'%s\', Actual: \'%s\'', test.err.expected, test.err.actual);
            }
            that.onTestFail(test);
        });
    });
};
