var assert = require('assert');
var q = require('q');
var sinon = require('sinon');
var jiveClient = require(process.cwd() + '/../jive-sdk-api/lib/client/jive');

describe('jive', function () {
    before(function() {
        this.sandbox = sinon.sandbox.create();
        this.sandbox.inject(this);
    });

    after(function() {
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

            ok.resolve({'a':'b'});
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
    });
});
