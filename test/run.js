
var jive = require('../jive-sdk-service/api.js');
var q = require('q');
var path = require('path');

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
    require('./unit/run').runTests(
        {
            'jive': jive,
            'runMode' : runMode
        }
    );
};

if ( runMode =='test' ) {
    runTests(jive);
} else if ( runMode == 'coverage' )  {
    jive.util.fsexists(apiDirTarget).then( function(exists) {
        return exists ? jive.util.fsrmdir(apiDirTarget) : q.resolve();
    }).then( function() {
        return setupCoverageDirs( apiDirSrc, apiDirTarget + '/jive-sdk-api' );
    }).then( function() {
        return setupCoverageDirs( apiDirSrc, apiDirTarget + '/jive-sdk-service' );
    }).then( function() {
        runTests(require(apiDirTarget + '/jive-sdk-service/api'));
    });

} else {
    console.log("Unrecognized run mode:" ,runMode);
}

