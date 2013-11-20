var assert = require('assert');

describe('jive.util', function () {

    describe('#buildRequest()', function () {

        it('test rejectUnauthorized option is added', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];

            jive.context['config']['development'] = true;

            mockery.registerMock('request', function (options, cb) {
                if ( options['rejectUnauthorized'] ) {
                    assert.fail( options['rejectUnauthorized'],  false );
                }
                done();
            });
            jive.util.buildRequest( 'http://www.yahoo.com', 'GET');
        });

        it('test port - non standard', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];

            mockery.registerMock('request', function (options, cb) {
                if ( options['port'] != 8091) {
                    assert.fail( options['port'], 8091);
                }
                done();
            });
            jive.util.buildRequest( 'http://xyz.com:8091/mypath?foo=bar', 'GET');
        });

        it('test port - 80', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];

            mockery.registerMock('request', function (options, cb) {
                if ( options['port'] ) {
                    assert.fail( options['port'], undefined );
                }
                done();
            });
            jive.util.buildRequest( 'http://xyz.com/mypath?foo=bar', 'GET');
        });

        it('test port - 443', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];

            mockery.registerMock('request', function (options, cb) {
                if ( options['port'] ) {
                    assert.fail( options['port'], undefined );
                }
                done();
            });
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'GET');
        });

        it('test POST object by default', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = {'my':'object'};

            mockery.registerMock('request', function (options, cb) {
                var headers = options['headers'];
                if ( headers['Content-Type'] !== 'application/json' ) {
                    assert.fail( headers['Content-Type'], 'application/json' );
                }
                if ( headers['Content-Length'] != JSON.stringify(postObj).length ) {
                    assert.fail( headers['Content-Length'], JSON.stringify(postObj).length );
                }
                done();
            });
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj );
        });

        it('test POST object by default (string)', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = JSON.stringify( {'my':'object'} );

            mockery.registerMock('request', function (options, cb) {
                var headers = options['headers'];
                if ( headers['Content-Type'] !== 'application/json' ) {
                    assert.fail( headers['Content-Type'], 'application/json' );
                }
                done();
            });
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj );
        });

        it('test POST object, explicit JSON type', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = JSON.stringify( {'my':'object'} );

            mockery.registerMock('request', function (options, cb) {
                var headers = options['headers'];
                if ( headers['Content-Type'] !== 'application/json' ) {
                    assert.fail( headers['Content-Type'], 'application/json' );
                }
                done();
            });

            var headers = { 'Content-Type': 'application/json' };
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj, headers );
        });

        it('test POST stringified object, explicit JSON type', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = JSON.stringify( {'my':'object'} );

            mockery.registerMock('request', function (options, cb) {
                var headers = options['headers'];
                if ( headers['Content-Type'] !== 'application/json' ) {
                    assert.fail( headers['Content-Type'], 'application/json' );
                }
                done();
            });

            var headers = { 'Content-Type': 'application/json' };
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj, headers );
        });

        it('test exception on POST of nonobject, explicit JSON type', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = function(){};

            mockery.registerMock('request', function (options, cb) {
                var headers = options['headers'];
                if ( headers['Content-Type'] !== 'application/json' ) {
                    assert.fail( headers['Content-Type'], 'application/json' );
                }
                cb(undefined, {});
            });

            var headers = { 'Content-Type': 'application/json' };
            try {
                jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj, headers);
                assert.fail();
            } catch (e) {
                done();
            }
        });

        it('test POST object as application/x-www-form-urlencoded', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = {
                "my" : "object"
            };

            mockery.registerMock('request', function (options, cb) {
                if ( options['body'] !== 'my=object' ) {
                    assert.fail( options['body'], 'my=object' );
                }
                done();
            });

            var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj, headers);
        });

    });
});