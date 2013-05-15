

var jive = require("jive-sdk");
var url = require('url');
var util = require('util');
var sampleOauth = require('./routes/oauth/sampleOauth');
var sfdc_helpers = require('./sfdc_helpers');


exports.pullOpportunity = pullOpportunity;

function pullOpportunity(tileInstance){

    var opportunityID = tileInstance.config.opportunityID;
    var uri = util.format("/sobjects/Opportunity/%s", opportunityID);
    var ticketID = tileInstance.config.ticketID;

    return sfdc_helpers.querySalesforceV27(ticketID, sampleOauth, uri).then(function(response) {
        var opportunity = response['entity'];
        return convertToListTileData(opportunity);
    }).catch(function(err){
        jive.logger.error('Error querying salesforce', err);
    });

};


function convertToListTileData(opportunity) {
    var dataToPush = {
        data: {
            "title": opportunity['Name'],
            "contents": [

                {
                    "text": util.format("Stage Name: %s", opportunity['StageName']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Stage Name"
                },
                {
                    "text": util.format("Type: %s", opportunity['Type']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Type"
                },
                {
                    "text": util.format("Probability: %s", opportunity['Probability']) + "%",
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Close Date"
                },
                {
                    "text": util.format("Amount: $%d", opportunity['Amount']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Amount"
                },
                {
                    "text": util.format("Expected Revenue: $%d", opportunity['ExpectedRevenue']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Expected Revenue"
                },
                {
                    "text": util.format("Close Date: %s", opportunity['CloseDate']),
                    "icon": "http://farm6.staticflickr.com/5106/5678094118_a78e6ff4e7.jpg",
                    "linkDescription": "Close Date"
                },
                {
                    "text": new Date().toString().slice(0,40)
                }
            ],
            "config": {
                "listStyle": "contentList"
            }
        }
    };

    return dataToPush;
}