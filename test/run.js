var realJive = require('../jive-sdk-service/api.js');
var mockery = require('mockery');

var testUtils = require('./util/testUtils');


var makeRunner = function() {
    var cleanup = function() {
        mockery.resetCache();
    };

    var runner = testUtils.makeRunner( {
        'eventHandlers' : {
            'beforeTest' : function(test) {
                mockery.enable();
            },
            'onTestPass' : function(test) {
                cleanup();
            },
            'onTestFail' : function(test) {
                cleanup();
            },
            'setupSuite' : function(test) {
                mockery.registerMock('jive-sdk', realJive);
                mockery.enable();
                mockery.warnOnReplace(false);
                mockery.warnOnUnregistered(false);
            },
            'teardownSuite' : function(test) {
                mockery.deregisterAll();
                mockery.disable();
            }
        }
    });

    return runner;
};

function muteJiveLogging(jive) {
    var logger = jive.logger;
    logger.setLevel('FATAL');
    jive['context']['config']['logLevel'] = 'FATAL';
}

    //muteJiveLogging(realJive);

    makeRunner().runTests(
        {
            'context' : {
                'testUtils' : testUtils,
                'jive': realJive,
                'mockery' : mockery
            },
            reporter: 'spec',
            'rootSuiteName'  : 'jive',
            'testcases' : process.cwd()  + '/unit',
            'timeout' : 5000
        }
    ).then( function(allClear) {
        if ( allClear ) {
            process.exit(0);
        } else {
            process.exit(-1);
        }
    });
