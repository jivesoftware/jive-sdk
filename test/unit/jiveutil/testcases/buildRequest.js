var assert = require('assert');

describe('jive', function () {

    describe('#util.buildRequest()', function () {

        it('test rejectUnauthorized option is added in development mode', function (done) {
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

        it('test rejectUnauthorized option is added with strictSSL', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];

            jive.context['config']['development'] = false;
            jive.context['config']['strictSSL'] = false;

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

        it('test POST stringified object as application/x-www-form-urlencoded', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var postObj = JSON.stringify( {
                "my" : "object"
            } );

            mockery.registerMock('request', function (options, cb) {
                if ( options['body'] !== 'my=object' ) {
                    assert.fail( options['body'], 'my=object' );
                }
                done();
            });

            var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar', 'POST', postObj, headers);
        });

        it('test error callback on exception', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];

            mockery.registerMock('request', function (options, cb) {
                cb(new Error("Ouch!"));
            });

            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar').then(
                // success
                function() {
                    assert.fail('Expected an error');
                },

                // error
                function(e) {
                    if ( e ) {
                        done();
                    } else {
                        assert.fail('Expected an error');
                    }
                }
            );

        });

        it('test error callback on error response code', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var response = {
                'headers' : {'content-type': 'application/json'},
                'statusCode' : 400

            };
            var body = JSON.stringify( {
                'not' : 'allowed'
            } );

            mockery.registerMock('request', function (options, cb) {
                cb(undefined, response, body);
            });

            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar').then(
                // success
                function() {
                    assert.fail('Expected an error');
                },

                // error
                function(e) {
                    if ( e['statusCode'] != 400 ) {
                        assert.fail( e['statusCode'] , 400 );
                    }
                    if ( JSON.stringify(e['entity']) !== body ) {
                        assert.fail( e['body'] , body, 'expected entity response' );
                    }
                    done();
                }
            );

        });

        it('test successful call', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var response = {
                'headers' : {},
                'statusCode' : 200

            };
            var body = JSON.stringify( {
                'a' : 'ok'
            } );

            mockery.registerMock('request', function (options, cb) {
                cb(undefined, response, body);
            });

            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar').then(
                // success
                function() {
                    done();
                },

                // error
                function(e) {
                    assert.fail();
                }
            );
        });

        it('test successful call, non json response', function (done) {
            var jive = this['jive'];
            var mockery = this['mockery'];
            var response = {
                'headers' : {},
                'statusCode' : 200

            };
            var body = 'why u no give me json';

            mockery.registerMock('request', function (options, cb) {
                cb(undefined, response, body);
            });

            jive.util.buildRequest( 'https://xyz.com/mypath?foo=bar').then(
                // success
                function(response) {
                    if ( !response ) {
                        assert.fail();
                    }

                    if ( response['entity']['body'] !== body ) {
                        assert.fail();
                    }

                    done();
                },

                // error
                function(e) {
                    assert.fail();
                }
            );
        });

    });
});
