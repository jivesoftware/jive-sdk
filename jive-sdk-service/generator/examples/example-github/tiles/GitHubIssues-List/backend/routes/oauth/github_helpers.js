
var jive = require("jive-sdk");
var util = require('util');
var request = require("request") ;

exports.queryGitHubV3 = queryGitHubV3;
exports.postGitHubV3 = postGitHubV3;

function queryGitHubV3(ticketID, myOauth, uri){
    var tokenStore = myOauth.getTokenStore();

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found[0] != undefined ) {
            var accessToken = found[0]['accessToken'];

            var headers = {
                'User-Agent': 'Purposeful Places'
            };

            console.log("queryGitHubV3: " + "https://api.github.com:" + uri + "?access_token=" + accessToken);
            return jive.util.buildRequest(
                // special case - set port to 0 to tell underlying SDK not to default to port 443
                // we need to have NO port numbert attached to this request ....
                "https://api.github.com" + uri + "?access_token=" + accessToken,
                'GET', null, headers, null );
        }

        throw Error('No token record found for ticket ID=' + ticketID);
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error querying GitHub', err);
            return err;
        }
    );
}

function postGitHubV3(ticketID, myOauth, uri, data){
    var tokenStore = myOauth.getTokenStore();

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken'];

            var headers = {
                'User-Agent': 'Purposeful Places'  ,
                'Content-Type': 'application/json'
            };

            return jive.util.buildRequest(
                // special case - set port to 0 to tell underlying SDK not to default to port 443
                // we need to have NO port numbert attached to this request ....
                "https://api.github.com" + uri + "?access_token=" + accessToken,
                'POST', data, headers, null)

        }

        throw Error('No token record found for ticket ID');
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error posting to GitHub', err);
        }
    );
}
