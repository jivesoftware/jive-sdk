var jive = require('jive-sdk');
var util = require('util');
var q = require('q');

exports.route = function(req, res) {

    var conf = jive.service.options;
    var data =  {
        host : jive.service.serviceURL()
    };
    var instanceId = req.query.instanceId;

    /******/
    function loadTiles() {
        var deferred = q.defer();

        jive.tiles.findByDefinitionName('{{{TILE_NAME}}}').then(
            function(instances) {
                if (instances) {
                    data['instance'] = instances;
                    for (var x in instances) {
                        if (instances[x]['id'] == instanceId) {
                            data['context'] = instances[x];
                            break;
                        } // end if
                    } // end for x
                    if (!(data['context'])) {
                        data['context'] = instances[0];
                    } // end if
                } // end if
                deferred.resolve();
            },
            function(error) {
                deferred.reject(error);
            }
        );

        return deferred.promise;
    }; // end function

    /******/
    function loadActivities() {

        return jive.tiles.findByID(data['context']['id']).then(
              function(instance) {
                  var deferred = q.defer();

                  jive.community.findByCommunity(instance['jiveCommunity']).then(
                      function(community) {
                          jive.community.doRequest(
                              community,
                              {
                                  "path" : instance['config']['parent'].substring(instance['config']['parent'].indexOf('/api'))+"/activities?count=5",
                                  "method" : "GET",
                                  "headers" :  {
                                      "content-type" : "application/json"
                                  }
                              }
                          ).then(
                              function(success) {
                                  var entity = JSON.parse(success['entity']['body']);
                                  deferred.resolve(entity['list']);
                              },
                              function(error) {
                                  console.log(error);
                                  deferred.reject(error);
                              }
                          );
                      }
                  );

                  return deferred.promise;
              }
        );

    }; // end function

    /******/
     function loadUsers() {
        var deferred = q.defer();

        jive.tiles.findByID(data['context']['id']).then(
              function(instance) {
                  jive.community.findByCommunity(instance['jiveCommunity']).then(
                      function(community) {
                          jive.community.doRequest(
                              community,
                               {
                                   "path" : "/api/core/v3/people?count=5",
                                   "method" : "GET",
                                   "headers" :  {
                                       "content-type" : "application/json"
                                   }
                               }
                           ).then(
                              function(success) {
                                  var entity = JSON.parse(success['entity']['body']);
                                  deferred.resolve(entity['list']);
                              },
                              function(error) {
                                  console.log(error);
                                  deferred.reject(error);
                              }
                          );
                      }
                  );

              }

        );

        return deferred.promise;

     }; // end function

    /******************/
    var deferred = q.defer();

    console.log(0);
    loadTiles().then(
        function() {
            console.log(1);
            return loadUsers();
        }
    ).then(
        function(user) {
            console.log(2);
            data['user'] = user;
            return loadActivities();
        }
    ).then(
        function(activity) {
            console.log(3);
            data['activity'] = activity
            res.render('place.html', data);
            deferred.resolve();
        },
        function(error) {
            console.log(error);
            res.render('place.html', data);
            deferred.reject();
        }
    );

    return deferred.promise;
};