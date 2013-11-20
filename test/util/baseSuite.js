var Mocha = require('mocha');
var fs = require('fs');
var q = require('q');
var path = require('path');
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
    test['jive'] = exports.jive;
    test['mockery'] = mockery;

    mockery.enable();
    mockery.warnOnReplace(false);
};

exports.jive = {};

exports.teardownSuite = function(test) {
    mockery.disable();
};

exports.runTests = function(options) {
    var deferred = q.defer();

    exports.jive = options['jive'];

    var mochaOptions = {
        reporter: 'dot',
        ui: 'bdd',
        timeout: 10000
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
    var testDir = that.getTestDir();

    var tests = [];

    fs.readdir(testDir, function (err, files) {
        if (err) {
            console.log(err);
            return;
        }
        files.forEach(function (file) {
            if (path.extname(file) === '.js') {
                if ( !suppressMessages ) {
                    console.log('adding test file: %s', file);
                }
                var test = mocha.addFile(testDir + file);
            }
        });

        var runner = mocha.run(function () {
            that.beforeTest();
        });

        runner.on('suite', function (test) {
            if ( test['title'] == that.getParentSuiteName() ) {
                if ( !suppressMessages ) {
                    console.log('\n', that.getParentSuiteName());
                }
                that.setupSuite( test['ctx']);
            }
        });

        runner.on('suite end', function (test) {
            if ( test['title'] == that.getParentSuiteName() ) {
                that.teardownSuite(test);
            }
        });

        runner.on('end', function (test) {
            deferred.resolve();
        });

        runner.on('test', function (test) {
        });

        runner.on('pass', function (test) {
            if ( !suppressMessages ) {
                console.log('...Test "%s" passed', test.title);
            }
            that.onTestPass(test);
        });

        runner.on('fail', function (test) {
            if ( !suppressMessages ) {
                console.log('...Test "%s" failed', test.title);
                if (test.err && (test.err.expected || test.err.actual) ) {
                    console.log('Expected: \'%s\', Actual: \'%s\'', test.err.expected, test.err.actual);
                }
            }
            that.onTestFail(test);
        });

    });

    return deferred.promise;
};
