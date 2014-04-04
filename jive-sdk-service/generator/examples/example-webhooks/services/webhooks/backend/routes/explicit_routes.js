var jive = require('jive-sdk');
var fs = require('fs');

exports.getWebhooksLog = {
    'path' : '/webhooks',
    'verb' : 'get',
    'route': function(req, res) {
        var raw = '<head> <link rel="stylesheet" type="text/css" href="' + jive.service.serviceURL() + '/stylesheets/style.css"></head>';
        raw += '<h1>Webhooked Activity</h1>';

        jive.util.fsexists('webhooks.log').then(function(exists){
            if ( !exists ) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end( raw + "No data." );
            } else {
                jive.util.fsread('webhooks.log').then( function( data ) {
                    raw += data.toString();

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end( raw );
                })
            }
        });
    }
};

exports.postWebhooks = {
    'path' : '/webhooks',
    'verb' : 'post',
    'route': function(req, res) {
        var activityList = req.body;

        if ( activityList ) {
            activityList.forEach( function(activity) {
                console.log('->', activity);

                var toAppend = activity['activity']['content'];

                if ( activity['activity'] && activity['activity']['provider'] && activity['activity']['provider']['url'] ) {
                    toAppend += " @ <b>" + activity['activity']['provider']['url'] + "</b>"
                }

                if ( activity['activity'] && activity['activity']['object'] && activity['activity']['object']['summary'] ) {
                    toAppend += "<br>\n<div style='background-color:white;margin:4px;'>" + activity['activity']['object']['summary'] + "</div>"
                }

                toAppend += '<br>\n';

                fs.appendFile('webhooks.log', toAppend, function(err) {
                    console.log(err);
                });
            });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end( JSON.stringify( { } ) );
    }
};
