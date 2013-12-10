var assert = require('assert');
var q = require('q');


describe('jive', function () {

    describe('oauth handler', function () {
        it('accessTokenRefresher calls new method', function (done) {
            var oauth = this.jive.util.oauth;
            var handler = oauth.buildOAuthHandler(function() {
                assert(true, "the new handler was called.");
                done();
            });

            handler.accessTokenRefresher();
        });

        it('accessTokenRefresher calls new method', function (done) {
            var oauth = this.jive.util.oauth;
            var handler = oauth.buildOAuthHandler(function() {
                assert(true, "the new handler was called.");
                done();
            });

            handler.accessTokenRefresher();
        });
    });
});

