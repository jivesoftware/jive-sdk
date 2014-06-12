var assert = require('assert');
var test = require('../basePersistenceTest');

describe('jive', function () {

    describe ('#persistence.memory', function () {

        it('save', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var persistence = new jive.persistence.memory();

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

        it('find', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var persistence = new jive.persistence.memory();

            test.testFind(testUtils, persistence).then(
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

        it('remove', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var persistence = new jive.persistence.memory();

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

        it('remove - object', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var persistence = new jive.persistence.memory();

            test.testRemoveObject(testUtils, persistence).then(function() {
                done();
            }).fail(function(e) {
                done(e);
            }).finally(function() {
                return persistence.close();
            });
        });

        // xxx todo

    });

});

