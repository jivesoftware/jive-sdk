var assert = require('assert');
var express = require('express');

describe('jive', function () {

    describe('#request.buildRequest()', function () {

        var app, server;

        beforeEach(function() {
            app = express();

            server = app.listen(0);
        });

        afterEach(function() {
            server.close();
        });

        it('test security token removed - json response', function(done) {
            var jive = this['jive'];

            app.get('/test', function(req, res) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(jive.constants.SECURITY_STRING + JSON.stringify({"status": "ok" }) );
            });

            jive.util.buildRequest( 'http://localhost:'+server.address().port+'/test', 'GET').then(function(response) {
                assert.equal(response.statusCode, 200, 'statusCode == 200');
                assert.equal(response.entity.status, 'ok', 'entity statusCode == ok');

                done();
            }).fail(function(err) {
                done(err);
            });

        });

        it('test security token removed - no content type specified', function(done) {
            var jive = this['jive'];

            app.get('/test', function(req, res) {
                res.writeHead(200, { });
                res.end(jive.constants.SECURITY_STRING + JSON.stringify({"status": "ok" }) );
            });

            jive.util.buildRequest( 'http://localhost:'+server.address().port+'/test', 'GET').then(function(response) {
                assert.equal(response.statusCode, 200, 'statusCode == 200');
                assert.equal(response.entity.status, 'ok', 'entity statusCode == ok');

                done();
            }).fail(function(err) {
                done(err);
            });

        });

        it('test security token not removed - plain response', function(done) {
            var jive = this['jive'];

            app.get('/test', function(req, res) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(jive.constants.SECURITY_STRING + JSON.stringify({"status": "ok" }) );
            });

            jive.util.buildRequest( 'http://localhost:'+server.address().port+'/test', 'GET').then(function(response) {
                assert.equal(response.statusCode, 200, 'statusCode == 200');
                assert.equal(response.entity.status, 200, 'entity statusCode == 200');

                assert.ok(response.entity.body instanceof Buffer, 'entity body is Buffer');
                assert.equal(response.entity.body.toString(), jive.constants.SECURITY_STRING + JSON.stringify({"status": "ok" }));

                done();
            }).fail(function(err) {
                done(err);
            });

        });

    });
});
