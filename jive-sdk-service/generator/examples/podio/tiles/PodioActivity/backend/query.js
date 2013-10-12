var q = require('q');
var jive = require("jive-sdk");

exports.doGet = function(query, instance) {
    var deferred = q.defer();

    var ticketID = instance['config']['ticketID'];

    var tokenStore = jive.service.persistence();
    tokenStore.find('tokens', {'ticket': ticketID }).then(function (found) {
        if (found) {
            var accessToken = found[0]['accessToken']['access_token'];

            jive.util.buildRequest(
                    "https://api.podio.com/" + query + ( query.indexOf('?') < 0 ? "?" : "&"  ) + "oauth_token=" + accessToken,
                    'GET'
                ).then(
                // success
                function (response) {
                    deferred.resolve(response);
                },

                // fail
                function (response) {
                    deferred.reject(response);
                }
            );
        }
    });

    return deferred.promise;
};

exports.doPost = function(query, body, instance) {
    var deferred = q.defer();

    var ticketID = instance['config']['ticketID'];

    var tokenStore = jive.service.persistence();
    tokenStore.find('tokens', {'ticket': ticketID }).then(function (found) {
        if (found) {
            var accessToken = found[0]['accessToken']['access_token'];

            jive.util.buildRequest(
                    "https://api.podio.com/" + query + ( query.indexOf('?') < 0 ? "?" : "&"  ) + "oauth_token=" + accessToken,
                    'POST', body
                ).then(
                // success
                function (response) {
                    deferred.resolve(response);
                },

                // fail
                function (response) {
                    deferred.reject(response);
                }
            );
        }
    });

    return deferred.promise;
};