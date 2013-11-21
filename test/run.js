
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

var runTests = function(jive) {

    muteJiveLogging(jive);

    var unitDir = process.cwd() + '/unit';

    realJive.util.fsreaddir(unitDir).then( function(items) {

        var promises = [];

        items.forEach( function(item) {
            var fullItemPath = unitDir + '/' + item;

            var p = realJive.util.fsisdir( fullItemPath).then( function(isDir ) {
                if ( isDir ) {
                    var toRequire = fullItemPath + '/run.js';
                    var testSpec =  {
                        'jive': jive,
                        'runMode' : runMode,
                        'testcases' :  fullItemPath + '/testcases',
                        'timeout' : 1500
                    };

                    return realJive.util.fsexists(toRequire).then( function(exists) {
                        if ( !exists ) {
                            return makeRunner().runTests(testSpec);
                        } else {
                            return require( toRequire ).runTests(testSpec);
                        }
                    });
                }
            });

            promises.push(p);
        });

        q.all(promises);

    });
};

var makeRunner = function() {
    var runner = Object.create(require('./util/baseSuite'));
    runner.getParentSuiteName = function() {
        return 'jive';
    };
    return runner;
};

function muteJiveLogging(jive) {
    var logger = jive.logger;
    logger.setLevel('FATAL');
    jive['context']['config']['logLevel'] = 'FATAL';
}

if ( runMode =='test' ) {
    runTests(realJive);

//    makeRunner().runTests(
//        {
//            'jive': realJive,
//            'runMode' : runMode,
//            'testcases' :   process.cwd()  + '/unit',
//            'timeout' : 2000
//        }
//    );

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
                'jive': jive,
                'runMode' : runMode,
                'testcases' :   process.cwd()  + '/unit',
                'timeout' : 2000
            }
        );
    });

} else {
    console.log("Unrecognized run mode:" ,runMode);
}

