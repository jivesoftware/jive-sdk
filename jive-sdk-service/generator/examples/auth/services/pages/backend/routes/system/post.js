var jive = require('jive-sdk');
var util = require('util');
var q = require('q');

exports.route = function(req, res){
    var deferred = q.defer();
    var conf = jive.service.options;

    var message = req.body.message;
    var tenantId = req.body.tenantId;
    var userId = req.body.userId;

    jive.community.findByTenantID(tenantId).then(
        function( community ) {
            return jive.community.doRequest(
                community,
                {
                    "path" : "/api/core/v3/contents",
                    "method" : "POST",
                    "postBody" :  {
                                   "content": {
                                       "type": "text/html",
                                       "text": "<body><p>"+message+"</p></body>"
                                   },
                                   "type": "update",
                                   "visibility" : "all"
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
        res.send('<html><head><title>Success</title></head><body><p align="center">Success</p><br/></p><div align="center"><a href="./system">Reload System</a></div></body></html>');
        deferred.resolve();
       },
       function(error) {
        res.send('<html><head><title>Error</title></head><body><p align="center">Error: '+error['entity']['error']['message']+'</p><br/></p><div align="center"><a href="./system">Reload System</a></div></body></html>');
        deferred.resolve();
       }
    );

    return deferred.promise;
};