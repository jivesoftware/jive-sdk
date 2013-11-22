var assert = require('assert');
var q = require('q');
var express = require('express');
var http = require('http');

describe('jive', function () {
    describe('tiles registration', function () {

        var tearDown = function(jive, service, jiveServer) {
            return (service ? service : q.resolve() ).stop().then( function() {
                return (jiveServer ? jiveServer : q.resolve()).stop();
            });
        };

        it('tile name same as tile dir', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];
            var newInstance = testUtils.createExampleInstance();
            newInstance['name'] = 'samplelist';

            // setup mock jive
            var app = express();

            var community;
            var service;
            var jiveServer;

            testUtils.createServer( {
                'port' : 5556,
                'routes' : [
                    {
                        'method' : 'post',
                        'statusCode' : '200',
                        'path' : '/oauth2/token',
                        'body' : {
                            'yee'  : 'haaa'
                        }
                    }
                ]
            }).then( function(_jiveServer ) {
                jiveServer = _jiveServer;
                return q.resolve();
            }).then( function(){
                // setup service options
                var options = testUtils.createBaseServiceOptions('/services/tile_simple');
                delete options['role'];
                options['port'] = 5555;
                options['logLevel'] = 'FATAL';
                options['clientUrl'] = 'http://localhost:5555';
                return testUtils.setupService(jive, options, app);
            }).then(function(_service) {
                service = _service;
                return testUtils.persistExampleCommunities(jive, 1, 'http://localhost:5556')
            }).then( function (_community ) {
                community = _community;
                return q.resolve(community);
            }).then( function() {
                // do some tests
                var header = testUtils.createAuthorizationHeader(community);
                return jive.util.buildRequest('http://localhost:5555/registration', 'POST',
                    // body
                    {
                        'guid'          :   jive.util.guid(),
                        'remoteID'      :   jive.util.guid(),
                        'config'        :   {},
                        'name'          :   newInstance['name'],
                        'jiveUrl'       :   community['jiveUrl'],
                        'tenantID'      :   community['tenantId'],
                        'pushUrl'       :   testUtils.createFakeURL(),
                        'code'          :   testUtils.guid()
                    },

                    // headers
                    {
                        'Authorization' : header
                    }
                ).then( function(response) {
                    console.log(response);
                }, function(e) {
                    console.log(e);
                });
            }).then(
                function() {
                    return tearDown(jive, service, jiveServer).then( function() {
                        console.log("WORKED");
                        done();
                    });
                },
                function (e) {
                    return tearDown(jive, service, jiveServer).then( function() {
                        assert.fail(e[0], e[1]);
                    });
                }
            );
        });

    });

});