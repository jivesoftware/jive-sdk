var jive = require('../api');
var client = require('../lib/client');
var q = require('q');

exports.register = function( registration ) {
    var deferred = q.defer();
    var authorizationCode = registration['code'];
    var scope = registration['scope'];
    var tenantId = registration['tenantId'];
    var jiveUrl = registration['jiveUrl'];
    var clientId = registration['clientId'];
    var jiveSignature = registration['jiveSignature'];

    // xxx todo - validate jiveSignature, then do access token exchange

    var registrationToSave = JSON.parse( JSON.stringify(registration) );

    // do access token exchange
    client.requestAccessToken(
        {
            'client_id' : clientId,
            'code' : authorizationCode,
            'jiveUrl' : jiveUrl,
            'scope' : scope,
            'tenantId' : tenantId
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