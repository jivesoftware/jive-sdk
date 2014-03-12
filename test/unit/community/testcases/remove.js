var assert = require('assert');
var q = require('q');
var sinon = require('sinon');
var jiveClient = require(process.cwd() + '/../jive-sdk-api/lib/client/jive');

describe('jive', function () {
    beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
        this.sandbox.inject(this);
    });

    afterEach(function() {
        this.sandbox.restore();

        this['jive'].events.removeAllListeners('unregisterJiveInstanceSuccess').removeAllListeners('unregisterJiveInstanceFailed');
    });

    describe('community - remove', function () {

        it('happy path', function (done) {
            var testUtils = this['testUtils'];
            var jive = this['jive'];
            jive.context['persistence'] = new jive.persistence.memory();

            testUtils.persistExampleCommunities(jive, 1).then(function(community) {

                return jive.community.remove(community).then(function() {
                    done();
                }).fail(function() {
                    assert.fail();
                });

            });
        });

        it('happy path - events', function (done) {
            var testUtils = this['testUtils'];
            var jive = this['jive'];
            jive.context['persistence'] = new jive.persistence.memory();


            testUtils.persistExampleCommunities(jive, 1).then(function(community) {
                jive.events.once('unregisterJiveInstanceSuccess', function() {
                    done();
                });

                jive.events.once('unregisterJiveInstanceFailed', function(e) {
                    assert.fail(e);
                });

                jive.community.remove(community);
            });
        });

        it('failed remove - no community', function (done) {
            var jive = this['jive'];
            jive.context['persistence'] = new jive.persistence.memory();

            return jive.community.remove().then(function() {
                assert.fail();
            }, function() {
                done();
            });
        });

        it('failed remove - no community - event', function (done) {
            var jive = this['jive'];
            jive.context['persistence'] = new jive.persistence.memory();

            jive.events.once('unregisterJiveInstanceSuccess', function() {
                assert.fail();
            });

            jive.events.once('unregisterJiveInstanceFailed', function() {
                done();
            });

            jive.community.remove().then(function() {}, function() {});
        });

        it('failed remove - missing community', function (done) {
            var testUtils = this['testUtils'];
            var jive = this['jive'];
            jive.context['persistence'] = new jive.persistence.memory();

            var community = testUtils.createExampleCommunity("http://missing");

            return jive.community.remove(community).then(function() {
                assert.fail();
            }).fail(function() {
                done();
            });
        });

        it('failed remove - missing community - event', function (done) {
            var testUtils = this['testUtils'];
            var jive = this['jive'];
            jive.context['persistence'] = new jive.persistence.memory();

            var community = testUtils.createExampleCommunity("http://missing");

            jive.events.once('unregisterJiveInstanceSuccess', function() {
                assert.fail();
            });

            jive.events.once('unregisterJiveInstanceFailed', function(e) {
                done();
            });

            jive.community.remove(community).then(function() {}, function() {});
        });

    });
});
