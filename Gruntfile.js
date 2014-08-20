module.exports = function(grunt) {

    var jive = require('./jive-sdk-service/api');
    var mockery = require('mockery');

    grunt.initConfig({

        runJiveTests: {
            options: {
                testcases: 'test/unit',
                context: function() {
                    return {
                        jive: jive,
                        testUtils: require('./test/util/testUtils'),
                        mockery : mockery
                    }
                },
                eventHandlers: {
                    onTestPass: function () {
                        mockery.resetCache();
                    },
                    onTestFail: function () {
                        mockery.resetCache();
                    },
                    setupSuite: function () {
                        var logger = jive.logger;
                        logger.setLevel('FATAL');
                        jive['context']['config']['logLevel'] = 'FATAL';
                        console.log('registering');
                        mockery.registerMock('jive-sdk', jive);
                        mockery.enable();
                        mockery.warnOnReplace(false);
                        mockery.warnOnUnregistered(false);
                    },
                    teardownSuite: function () {
                        mockery.deregisterAll();
                        mockery.disable();
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('jive-testing-framework');

    grunt.registerTask('test', ['runJiveTests']);
    grunt.registerTask('default', ['test']);
};

