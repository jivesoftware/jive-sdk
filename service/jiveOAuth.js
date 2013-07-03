var jive = require('../api');
var client = require('../lib/client');
var q = require('q');

exports.register = function( registration ) {
    var deferred = q.defer();
    var tenantId = registration['tenantID'];
    var jiveUrl = registration['jiveURL'];

    var registrationToSave = JSON.parse( JSON.stringify(registration) );

    // do access token exchange
    client.requestAccessToken(
        {
            'client_id' : registration['clientID'],
            'code' : registration['code'],
            'jiveUrl' : registration['jiveUrl']
        },

        function(response) {
            // successfully exchanged for access token:
            // save registration
            registrationToSave['OAuth'] = response;
            jive.service.persistence().save('jiveTrustStore', tenantId, registrationToSave ).then(
                function() {
                    // successful save
                    deferred.resolve();
                },
                function(error) {
                    // error saving
                    deferred.reject(error);
                }
            );
        },

        function(error) {
            // failed to exchange for access token
            deferred.reject( error );
        }
    );

    return deferred.promise;
};