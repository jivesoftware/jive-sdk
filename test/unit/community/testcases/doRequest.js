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
    });

    describe('community', function () {
        it('doRequest with access token refresh', function (done) {
            var jive = this.jive;
            jive.context.persistence =  new jive.persistence.memory();
            var needsRefresh = q.defer();
            var ok = q.defer();
            var current = needsRefresh;
            var community = {oauth: {}, jiveUrl: "http://localhost:8080"};

            this.stub(jive.util, "buildRequest", function( f ) {
                var thisOne = current;
                current = ok;
                return thisOne.promise;
            });

            this.stub(jiveClient, "refreshAccessToken", function(f, success) {
                success({statusCode: 200, entity: {access_token:'abc', refresh_token: 'bbb'}});
            });

            this.stub(jive.community, "findByCommunity").returns(q(community));

            ok.resolve({statusCode: 200, entity: {'a':'b'}});
            needsRefresh.reject({statusCode: 403});

            jive.community.doRequest(community, {path:"/api/core/v3/people/@me"}).then(
                function() {
                    done();
                },
                function() {
                    assert.ok(false, "The request should not fail if the refresh is successful.");
                    done();
                });
        });

        it('doRequest with access token refresh with manual callback', function (done) {
            var jive = this.jive;
            jive.context.persistence =  new jive.persistence.memory();
            var needsRefresh = q.defer();
            var ok = q.defer();
            var current = needsRefresh;
            var community = {jiveUrl: "http://localhost:8080"};
            var newToken;
            var authHeaders = [];

            this.stub(jive.util, "buildRequest", function( url, method, postBody, headers, requestOptions ) {
                var thisOne = current;
                current = ok;

                authHeaders.push(headers.Authorization);

                return thisOne.promise;
            });

            this.stub(jiveClient, "refreshAccessToken", function(f, success) {
                success({statusCode: 200, entity: {access_token:'abc', refresh_token: 'bbb'}});
            });

            this.stub(jive.community, "findByCommunity").returns(q(community));

            ok.resolve({statusCode: 200, entity: {'foo':'b'}});
            needsRefresh.reject({statusCode: 403});

            try {
                jive.community.doRequest(community, {path: "/api/core/v3/people/@me", oauth: {access_token: '1'}, tokenPersistenceFunction: function (newOAuth) {
                    assert.equal(newOAuth.access_token, 'abc', "AccessToken refresh function called.");
                    newToken = newOAuth.access_token;
                }}).then(
                    function () {
                        assert.equal(newToken, 'abc', "AccessToken refresh function called.");
                        assert.equal(jive.util.buildRequest.callCount, 2, "two calls to buildRequest are expected.");
                        assert.equal(authHeaders[0], 'Bearer 1');
                        assert.equal(authHeaders[1], 'Bearer abc');
                        done();
                    },
                    function () {
                        assert.ok(false, "The request should not fail if the refresh is successful.");
                        done();
                    });
            } catch (e) {
                assert.fail(e);
                done();
            }
        });
    });
});
