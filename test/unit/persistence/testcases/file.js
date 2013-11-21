var assert = require('assert');
var test = require('../basePersistenceTest');

describe('jive', function () {

    describe('#persistence.file', function () {
        it('test', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var config = {
                    'dataDirPath' : dir
                };
                var persistence = new jive.persistence.file(config);

                test.testSave(testUtils, persistence).then( function(saved) {
                    console.log(saved);
                }).finally( function() {
                    return persistence.close().then( function() {
                        done();
                    })
                });
            });

        });
    });

});

