var jive = require("jive-sdk");

var SFDC_PREFIX = '/services/data/v27.0';

exports.querySalesforceV27 = querySalesforceV27;
exports.postSalesforceV27 = postSalesforceV27;

function querySalesforceV27(ticketID, uri){

    var tokenStore = jive.service.persistence();

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];
            var host = found[0]['accessToken']['instance_url'];

            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            return jive.util.buildRequest(host + SFDC_PREFIX + uri, 'GET', null, headers, null);
        }

        throw Error('No token record found for ticket ID');
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error querying salesforce', err);
        }
    );
}

function postSalesforceV27(ticketID, uri, data){

    var tokenStore = jive.service.persistence();

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];
            var host = found[0]['accessToken']['instance_url'];

            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            return jive.util.buildRequest(host + SFDC_PREFIX + uri, 'POST', data, headers, null);
        }

        throw Error('No token record found for ticket ID');
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error querying salesforce', err);
        }
    );
};
