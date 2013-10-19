var url = require('url');
var jive = require('jive-sdk');
var sfdc_helpers = require('../../sfdc_helpers');

exports.handleSfdcQuery = function (req, res) {
    var url_parts = url.parse(req.url, true);
    var queryPart = url_parts.query;

    var query = queryPart["query"];
    var ticketID = queryPart["ticketID"];
    var uri = "/query?q=" + encodeURIComponent(query);

    sfdc_helpers.querySalesforceV27(ticketID, uri).then(function (response) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response['entity']));
    }).catch(function (err) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(err));
    });

};