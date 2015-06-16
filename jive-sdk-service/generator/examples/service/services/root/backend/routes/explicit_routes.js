var jive = require('jive-sdk');

exports.explicitRouteExample = {
    'verb' : 'get',
    'path' : 'explicit/route/example',
    'route': function(req,res) {
        res.render('hello.html', { routeMethod : 'explicit', name: jive.util.guid() } );
    }
};