var jive = require('jive-sdk');
var util = require('util');
var q = require('q');

exports.route = function(req, res) {

    var userId = req.body.userId;
    var subject = req.body.subject;
    var message = req.body.message;
    var instanceId = req.body.instanceId;

    function findCommunityFromTile(instance) {
        var deferred = q.defer();

        jive.community.findByCommunity(instance['jiveCommunity']).then(
            function(community) {
                deferred.resolve({ 'instance' : instance, 'community' : community });
            } // end function
        );

        return deferred.promise;
    };

    /****************************************/

    var conf = jive.service.options;
    var deferred = q.defer();

    jive.tiles.findByID(instanceId).then(
        function(instance) {
            return findCommunityFromTile(instance);
        }
    ).then(
        function(params) {
            return jive.community.doRequest(
                params['community'],
                {
                    "path" : "/api/core/v3/contents",
                    "method" : "POST",
                    "postBody" :  {
                               "content": {
                                   "type": "text/html",
                                   "text": "<body><p>"+message+"</p></body>"
                               },
                               "subject" : subject,
                               "visibility" : "place",
                               "parent" : params['instance']['config']['parent'],
                               "type": "discussion"
                            },
                    "headers" :  {
                        "content-type" : "application/json",
                        "X-Jive-Run-As" : "userid " + userId
                    }
                }
            );
        }
    ).then(
       function(success) {
           res.send('<html><head><title>Success</title></head><body><p align="center">Success</p><br/></p><div align="center"><a href="./place">Reload Place</a></div></body></html>');
           deferred.resolve();
       },
       function(error) {
           res.send('<html><head><title>Error</title></head><body><p align="center">Error: '+error['entity']['error']['message']+'</p><br/></p><div align="center"><a href="./place">Reload Place</a></div></body></html>');
           deferred.resolve();
       }
    );

    return deferred.promise;
};
