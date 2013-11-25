var assert = require('assert');
var q = require('q');

describe('jive', function () {

    describe('service routes', function () {

        it('happy path', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var options = testUtils.createBaseServiceOptions('/services/tile_routes');
            delete options['role'];
            options['port'] = 5555; options['logLevel'] = 'FATAL'; options['clientUrl'] = 'http://localhost:5555';
            testUtils.setupService(jive, options).then( function(service) {
                jive.util.buildRequest('http://localhost:5555/tiles').then( function(r) {
                    assert.ok( r['entity'] );
                    assert.equal( r['entity'].length, 1 );
                    assert.equal( r['entity'][0]['name'], 'samplelist' );
                    return jive.util.buildRequest('http://localhost:5555/absolute');
                }).then( function(r) {
                    assert.ok( r['entity'] );
                    assert.equal( r['entity']['body'], 'absolute' );
                    return jive.util.buildRequest('http://localhost:5555/samplelist/configure/nested');
                }).then( function(r) {
                    assert.ok( r['entity'] );
                    assert.equal( r['entity']['body'], 'configure' );
                    return jive.util.buildRequest('http://localhost:5555/samplelist/relative');
                }).then( function(r) {
                    assert.ok( r['entity'] );
                    assert.equal( r['entity']['body'], 'relative' );
                }).then( function() {
                    service.stop().then( function() {
                        done();
                    });
                });
            })
        });

        it('locked route', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            var options = testUtils.createBaseServiceOptions('/services/tile_routes');
            delete options['role'];
            options['port'] = 5555; options['logLevel'] = 'FATAL'; options['clientUrl'] = 'http://localhost:5555';
            testUtils.setupService(jive, options).then( function(service) {
                jive.util.buildRequest('http://localhost:5555/locked').then(
                    function(r) {
                        assert.fail(r, 'expected error');
                    },

                    function(e) {
                        assert.ok(e);
                        assert.equal(e['statusCode'], 403);
                        assert.equal(e['entity']['error'], 'Invalid or missing authorization headers.');
                    }
                ).then( function() {
                    service.stop().then( function() {
                        done();
                    });
                });
            })
        });

    });

});

