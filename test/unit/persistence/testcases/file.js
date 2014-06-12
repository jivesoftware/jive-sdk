var assert = require('assert');
var test = require('../basePersistenceTest');

describe('jive', function () {

    describe('#persistence.file', function () {

        it('save', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var persistence = new jive.persistence.file({ 'fileFlushInterval' : 200, 'dataDirPath': dir });

                test.testSave(testUtils, persistence).then(
                    function() {
                        setTimeout( function() {
                            done();
                        }, 1000);
                    },

                    function(e) {
                        assert.fail(e);
                    }
                ).finally( function() {
                    return persistence.close();
                });
            });
        });

        it('remove', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var persistence = new jive.persistence.file({ 'dataDirPath': dir });

                test.testRemove(testUtils, persistence).then(
                    function() {
                        done();
                    },

                    function(e) {
                        assert.fail(e);
                    }
                ).finally( function() {
                    return persistence.close();
                });
            });
        });

        it('remove - object', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var persistence = new jive.persistence.file({ 'dataDirPath': dir });

                test.testRemoveObject(testUtils, persistence).then(
                    function() {
                        done();
                    },

                    function(e) {
                        assert.fail(e);
                    }
                ).finally( function() {
                        return persistence.close();
                    });
            });
        });

        it('find', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            testUtils.createTempDir().then( function(dir) {
                var persistence = new jive.persistence.file({ 'dataDirPath': dir });

                test.testFind(testUtils, persistence).then(
                    function() {
                        done();
                    },

                    function(e) {
                        assert.fail(e);
                    }
                ).finally( function() {
                    return persistence.close();
                });
            });
        });

        // xxx todo
    });

});

