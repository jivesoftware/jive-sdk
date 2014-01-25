var jive = require('jive-sdk');
var util = require('util');
var q = require('q');

exports.route = function(req, res) {

    var profile = req.body.profile;

    var conf = jive.service.options;
    var cloudalyticsConf = jive.service.options['cloudalytics'];

    var server = cloudalyticsConf['servers'][cloudalyticsConf['profiles'][profile]['server']];
    var clientID = cloudalyticsConf['profiles'][profile]['clientID'];
    var clientSecret = cloudalyticsConf['profiles'][profile]['clientSecret'];

    function getAccessToken() {
        var deferred = q.defer();
        var apiURL = 'https://'+server+'/analytics/v1/auth/login?clientId='+ clientID+'&clientSecret='+clientSecret;

        jive.util.buildRequest(apiURL,'POST').then(
                //*** SUCCESS ***
                function(response) {
                    deferred.resolve({
                        server : server,
                        profile : profile,
                        accessToken : response['entity']['body']
                    });
                },
                //*** ERROR ***
                function(response) {
                    deferred.reject(response['entity']['error']);
                }
        );

        return deferred.promise;
    };

    function saveAndContinue(data) {
        var deferred = q.defer();

        var profile = data['profile'];
        var accessToken = data['accessToken'];


        var store = jive.service.persistence();
        jive.service.persistence().find('cloudalyticsTokens', { 'id' : profile }).then(
            function(found) {

                store.save('cloudalyticsTokens', profile, {
                    id : profile,
                    accessToken : accessToken,
                    expires : 'TODO'
                }).then(
                    function() {
                        deferred.resolve(data);
                    },
                    function(error) {
                        deferred.reject(error);
                    }
                );
            }
        );

        return deferred.promise;
    };


    /***********/

    if (!clientID && !clientSecret) {
        res.send('Invalid Configuration, Please see jivelclientconfiguration.json');
        return;
    } // end if

    var deferred = q.defer();

    getAccessToken().then(
        function(data) {
            return saveAndContinue(data);
        }
    ).then(
        function(data) {
            res.redirect('/cloudalytics/reports?profile='+profile);
            deferred.resolve();
        },
        function(error) {
            console.log('Error: '+error);
            res.render('start.html', {
                error : error,
                profile : profile,
                host: jive.service.serviceURL()
            });
            deferred.reject();
        }
    );

    return deferred.promise;
};
