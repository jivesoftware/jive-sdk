var url = require('url');
var jive = require('jive-sdk');

var sampleOauth = require('./sampleOauth.js');

exports.handleSfdcQuery = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var queryPart = url_parts.query;

    var query = queryPart["query"];
    var ticketID = queryPart["ticketID"];

    var tokenStore = sampleOauth.getTokenStore();

    tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found ) {
            var accessToken = found[0]['accessToken']['access_token'];
            var host = found[0]['accessToken']['instance_url'];

            var headers = {
                'Authorization': 'Bearer ' + accessToken
            };

            jive.util.buildRequest(
                host + "/services/data/v20.0/query?q=" + encodeURIComponent( query ),
                'GET',
                null,
                headers
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