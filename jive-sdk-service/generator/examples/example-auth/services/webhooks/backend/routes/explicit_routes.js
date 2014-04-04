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
            activityList.forEach( function(event) {
                var activity = event['activity'];
                var webhook = event['webhook'];

                if (activity['verb'] === "jive:social_group_created") {
                    var placeUri = activity['object']['id'];
                    var communityUri = webhook.substring(0,webhook.indexOf('/api'));
                    function doWebhook(community,accessToken) {
                        jive.webhooks.register(
                                community,
                                undefined,
                                placeUri,
                                jive.service.serviceURL() + '/webhooks',
                                accessToken
                            ).then(function (webhook) {
                               console.log('Successfully created WebHook for Group['+placeUri+']');
                            });
                    } // end doWebhook

                    jive.community.findByJiveURL(communityUri).then(
                        function(community) {
                            doWebhook( community , community['oauth']['access_token']);
                        }
                    );
                } // end if

                fs.appendFile('webhooks.log', '\n<hr/>\n<div><p><strong>'+webhook+'</strong></p><pre style="font-size: 0.6em;">'+JSON.stringify(activity)+'</pre></div>', function(err) {
                    //console.log(err);
                });
            });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end( JSON.stringify( { } ) );
    }
};
