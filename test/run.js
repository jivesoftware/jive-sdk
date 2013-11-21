
var realJive = require('../jive-sdk-service/api.js');
var q = require('q');
var path = require('path');
var fs = require('fs');

var apiDirSrc = path.normalize(  process.cwd() + '/../jive-sdk-api' );
var apiDirTarget = path.normalize( process.cwd() + '/node_modules/jive-sdk-cov' );

var setupCoverageDirs = function(apiDirSrc, apiDirTarget) {
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
        'apiDirTarget' : apiDirTarget
    };

    child.send({func: JSON.stringify(options)});

    return deferred.promise;
};

var runMode = process.env.JIVE_SDK_TEST_RUN_MODE || process.argv[2] || 'test';

var runTests = function(jive) {

    var unitDir = process.cwd() + '/unit';

    realJive.util.fsreaddir(unitDir).then( function(items) {

        var promises = [];

        items.forEach( function(item) {
            var fullItemPath = unitDir + '/' + item;

            var p = realJive.util.fsisdir( fullItemPath).then( function(isDir ) {
                if ( isDir ) {
                    var toRequire = fullItemPath + '/run.js';
                    console.log(toRequire);
                    var testSpec =  {
                        'jive': jive,
                        'runMode' : runMode,
                        'testcases' :  fullItemPath + '/testcases'
                    };

                    return realJive.util.fsexists(toRequire).then( function(exists) {
                        console.log(exists);
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

if ( runMode =='test' ) {
    runTests(realJive);
} else if ( runMode == 'coverage' )  {
    realJive.util.fsexists(apiDirTarget).then( function(exists) {
        return exists ? realJive.util.fsrmdir(apiDirTarget) : q.resolve();
    }).then( function() {
        return setupCoverageDirs( apiDirSrc, apiDirTarget + '/jive-sdk-api' );
    }).then( function() {
        return setupCoverageDirs( apiDirSrc, apiDirTarget + '/jive-sdk-service' );
    }).then( function() {
        var jive = require(apiDirTarget + '/jive-sdk-service/api');
        makeRunner().runTests(
            {
                'jive': jive,
                'runMode' : runMode,
                'testcases' :   process.cwd()  + '/unit'
            }
        );
    });

} else {
    console.log("Unrecognized run mode:" ,runMode);
}

