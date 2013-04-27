var url = require('url');
var jive = require('jive-sdk');

var sampleOauth = require('./sampleOauth.js');

exports.handleGoogleQuery = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var queryPart = url_parts.query;

    var query = queryPart["query"];
    var ticketID = queryPart["ticketID"];

    var tokenStore = sampleOauth.getTokenStore();
    tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];

                jive.util.buildRequest(
                    "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + accessToken,
                    'GET'
                ).then(
                // success
                function(response) {
                    var body = response['entity'];

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(body) );
                },

                // fail
                function(response) {
                    res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
                    res.end(response['entity']);
                }
            );
        }
    });

};