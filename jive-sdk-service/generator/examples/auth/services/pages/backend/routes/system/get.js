var jive = require('jive-sdk');
var util = require('util');
var q = require('q');


var store = jive.service.persistence();

exports.route = function(req, res) {
    var conf = jive.service.options;
    var data =  {
        host : jive.service.serviceURL()
    };
    var tenantID = req.query.tenantId;

    /******/
    function loadCommunities() {
        var deferred = q.defer();
        jive.community.find({ 'version' : 'post-samurai'}).then(
            function(results) {
                if (results) {
                    data['community'] = results;
                    for (var x in results) {
                        if (results[x]['tenantId'] == tenantID) {
                            data['context'] = results[x];
                            break;
                        } // end if
                    } // end for x
                    if (!(data['context'])) {
                        data['context'] = results[0];
                    } // end if
                } // end if
                deferred.resolve();
            },
            function(error) {
                deferred.resolve();
            }
        );

        return deferred.promise;
    }; // end function

    /******/
    function loadActivities() {
        return jive.community.doRequest(
            data['context'],
            {
                "path" : "/api/core/v3/activities?count=5",
                "method" : "GET",
                "headers" :  {
                    "content-type" : "application/json"
                }
            }
        );
    }; // end function

    /******/
    function loadUsers() {
        return jive.community.doRequest(
            data['context'],
            {
                "path" : "/api/core/v3/people?count=5",
                "method" : "GET",
                "headers" :  {
                    "content-type" : "application/json"
                }
            }
        );
    }; // end function

    /******************/
    var deferred = q.defer();

    loadCommunities().then(
        function() {
            return loadUsers();
        }
    ).then(
        function(success) {
            var entity = JSON.parse(success['entity']['body']);
            data['user'] = entity['list'];
            return loadActivities();
        }
    ).then(
        function(success) {
            var entity = JSON.parse(success['entity']['body']);
            data['activity'] = entity['list'];
            res.render('system.html', data);
            deferred.resolve();
        },
        function(error) {
            res.render('system.html', data);
            deferred.reject();
        }
    );

    return deferred.promise;
};