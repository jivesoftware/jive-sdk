var realJive = require('../jive-sdk-service/api.js');
var q = require('q');
var path = require('path');
var fs = require('fs');

var apiDirSrc = path.normalize(  process.cwd() + '/../jive-sdk-api' );
var serviceDirSrc = path.normalize(  process.cwd() + '/../jive-sdk-service' );
var apiDirTarget = path.normalize( process.cwd() + '/node_modules/jive-sdk-cov' );

var setupCoverageDirs = function(apiDirSrc, apiDirTarget, excludes) {
    excludes = excludes || [];
    var deferred = q.defer();

    var jscoverage =  process.cwd() + '/jscoverage.js';

    var fork = require('child_process').fork;
    var child = fork(jscoverage);

    child.on('message', function(response) {
        // kill the process
        child.kill();
        deferred.resolve();
    });

    var options = {
        'apiDirSrc' : apiDirSrc,
        'apiDirTarget' : apiDirTarget,
        'excludes' : excludes
    };

    child.send({func: JSON.stringify(options)});

    return deferred.promise;
};

var runMode = process.env.JIVE_SDK_TEST_RUN_MODE || process.argv[2] || 'test';
var runGroup = process.env.JIVE_SDK_TEST_RUN_GROUP || 'unit';
var runTimeout = 5000 || process.env.JIVE_SDK_TEST_RUN_TIMEOUT || 2000;

var makeRunner = function() {
    var runner = Object.create(require('./util/baseSuite'));
    var mockery = require('mockery');

    runner.getParentSuiteName = function() {
        return 'jive';
    };

    var cleanup = function() {
        mockery.resetCache();
    };

    runner.beforeTest = function() {
        mockery.enable();
    };

    runner.onTestPass = function(test) {
        cleanup();
    };

    runner.onTestFail = function(test) {
        cleanup();
    };

    runner.setupSuite = function(test) {
        test['testUtils'] = require('./util/testUtils');
        test['jive'] = runner.context.jive;
        test['mockery'] = mockery;

        mockery.registerMock('jive-sdk', runner.context.jive);

        mockery.enable();
        mockery.warnOnReplace(false);
        mockery.warnOnUnregistered(false);
    };

    runner.teardownSuite = function(test) {
        mockery.deregisterAll();
        mockery.disable();
    };

    return runner;
};

function muteJiveLogging(jive) {
    var logger = jive.logger;
    logger.setLevel('FATAL');
    jive['context']['config']['logLevel'] = 'FATAL';
}

if ( runMode =='test' ) {
    muteJiveLogging(realJive);

    makeRunner().runTests(
        {
            'context' : {
                'jive': realJive
            },
            'runMode' : runMode,
            'testcases' :   process.cwd()  + '/' + runGroup,
            'timeout' : runTimeout
        }
    ).then( function(allClear) {
        if ( allClear ) {
            process.exit(0);
        } else {
            process.exit(-1);
        }
    });

} else if ( runMode == 'coverage' )  {
    realJive.util.fsexists(apiDirTarget).then( function(exists) {
        return exists ? realJive.util.fsrmdir(apiDirTarget) : q.resolve();
    }).then( function() {
            return setupCoverageDirs( apiDirSrc, apiDirTarget + '/jive-sdk-api' );
        }).then( function() {
            return setupCoverageDirs( serviceDirSrc, apiDirTarget + '/jive-sdk-service', [ 'generator' ]);
        }).then( function() {
            return realJive.util.recursiveCopy( serviceDirSrc + '/generator', apiDirTarget + '/jive-sdk-service/generator' );
        }).then( function() {
            return setupCoverageDirs( serviceDirSrc + '/generator/sdk.js', apiDirTarget + '/jive-sdk-service/generator/sdk.js', []);
        }).then( function() {
            var jive = require(apiDirTarget + '/jive-sdk-service/api');
            // suppress logging
            muteJiveLogging(jive);
            makeRunner().runTests(
                {
                    'context' : {
                        'jive': jive
                    },
                    'runMode' : runMode,
                    'testcases' :   process.cwd()  + '/' + runGroup,
                    'timeout' : runTimeout
                }
            );
        });

} else {
    console.log("Unrecognized run mode:" ,runMode);
}
