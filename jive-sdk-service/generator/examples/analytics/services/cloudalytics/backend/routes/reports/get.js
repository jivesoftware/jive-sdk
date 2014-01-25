var jive = require('jive-sdk');
var util = require('util');
var q = require('q');

exports.route = function(req, res) {

    var profile = req.query.profile;

    var conf = jive.service.options;
    var cloudalyticsConf = jive.service.options['cloudalytics'];

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


    var deferred = q.defer();

    getAccessToken(profile).then(
        function(accessToken) {
            res.render('report-menu.html',
                {
                    host : jive.service.serviceURL(),
                    profile : profile,
                    accessToken : accessToken
                }
            );
            deferred.resolve();
        },
        function(error) {
            res.render('reports-menu.html',
                {
                    host : jive.service.serviceURL(),
                    error : error
                }
            );
            deferred.reject();
        }
    );

    return deferred.promise;

};
