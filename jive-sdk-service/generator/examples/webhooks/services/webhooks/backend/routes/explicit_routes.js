exports.getWebhooksLog = {
    'path' : '/webhooks',
    'verb' : 'get',
    'route': function(req, res) {
        var activityList = req.body;

        if ( activityList && activityList['forEach'] ) {
            activityList.forEach( function(activity) {
                console.log('->', activity);

                var toAppend = activity['activity']['content'];

                if ( activity['activity'] && activity['activity']['provider'] && activity['activity']['provider']['url'] ) {
                    toAppend += " @ <b>" + activity['activity']['provider']['url'] + "</b>"
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
