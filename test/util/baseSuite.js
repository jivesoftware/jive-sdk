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
    mockery.resetCache();
};

exports.onTestFail = function(test) {
    mockery.resetCache();
};

exports.setupSuite = function(test) {
    test['jive'] = exports.jive;
    test['mockery'] = mockery;

    mockery.enable();
    mockery.warnOnReplace(false);
};

exports.jive = {};

exports.teardownSuite = function(test) {
    mockery.deregisterAll();
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
    var testDir = options['testcases'] || exports.getTestDir();

    recursiveDirectoryProcessor( testDir, testDir, testDir, true, function(type, file) {
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
            deferred.resolve();
        });

        runner.on('test', function (test) {
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

var recursiveDirectoryProcessor = function (currentFsItem, root, targetRoot, force, processor) {

    var recurseDirectory = function (directory) {
        return q.nfcall(fs.readdir, directory).then(function (subItems) {
            var promises = [];
            subItems.forEach(function (subItem) {
                promises.push(recursiveDirectoryProcessor(directory + '/' + subItem, root, targetRoot, force, processor));
            });

            return q.all(promises);
        });
    };

    return q.nfcall(fs.stat, currentFsItem).then(function (stat) {
        var targetPath = targetRoot + '/' + currentFsItem.substr(root.length + 1, currentFsItem.length);

        if (stat.isDirectory()) {
            if (root !== currentFsItem) {
                return fsexists(targetPath).then(function (exists) {
                    if (root == currentFsItem || (exists && !force)) {
                        return recurseDirectory(currentFsItem);
                    } else {
                        return processor('dir', currentFsItem, targetPath).then(function () {
                            return recurseDirectory(currentFsItem)
                        });
                    }
                });
            }

            return recurseDirectory(currentFsItem);
        }

        // must be a file
        return fsexists(targetPath).then(function (exists) {
            if (!exists || force) {
                return processor('file', currentFsItem, targetPath)
            } else {
                return q.fcall(function () {
                });
            }
        });
    });
};

var fsexists = function (path) {
    var deferred = q.defer();
    var method = fs.exists ? fs.exists : require('path').exists;
    method(path, function (exists) {
        deferred.resolve(exists);
    });

    return deferred.promise;
};
