var jive = require('jive-sdk');
var util = require('util');
var q = require('q');

exports.route = function(req, res) {

    var profile = req.body.profile;
    var call = req.body.call;

    var conf = jive.service.options;
    var cloudalyticsConf = jive.service.options['cloudalytics'];

    var server = cloudalyticsConf['servers'][cloudalyticsConf['profiles'][profile]['server']];

    function getAccessToken(profile) {
        var deferred = q.defer();

        jive.service.persistence().find('cloudalyticsTokens', { 'id' : profile }).then(
            function(found) {
                if (found && found.length == 1) {
                    deferred.resolve(found[0]['accessToken']);
                } else {
                    deferred.reject();
                } // end if
            } // end function
        );

        return deferred.promise;
    };

    function getResults(accessToken) {

        var deferred = q.defer();
        var apiURL = 'https://'+server+'/analytics/v1/export'+call;

        var headers = { Authorization : accessToken };

        jive.util.buildRequest(apiURL,'GET',null,headers,null).then(
                //*** SUCCESS ***
                function(response) {
                    deferred.resolve({
                        results : response,
                        profile : profile
                    });
                },
                //*** ERROR ***
                function(response) {
                    deferred.reject(response);
                }
        );

        return deferred.promise;
    };

    var deferred = q.defer();

    getAccessToken(profile).then(
        function(accessToken) {
            return getResults(accessToken);
        }
    ).then(
        function(data) {
            var results = "";

            if (data.results.entity) {
                if (data.results.entity.body) {
                    results = JSON.stringify(data.results.entity.body).substring(1,(JSON.stringify(data.results.entity.body).length-1));
                } else {
                    results = JSON.stringify(data.results.entity);
                } // end if
            } else {
                results = data.results;
            } // end if

            console.log(results);

            results = results.replace(/\\n/g,'\n');

            res.render('report-results.html',
                {
                    host : jive.service.serviceURL(),
                    profile : profile,
                    results : results
                }
            );
            deferred.resolve();
        },
        function(error) {
            var entity = error.entity.body;
            res.render('report-results.html',
                {
                    host : jive.service.serviceURL(),
                    profile : profile,
                    results : entity
                }
            );
            deferred.reject(error);
        }
    );

    return deferred.promise;

};
