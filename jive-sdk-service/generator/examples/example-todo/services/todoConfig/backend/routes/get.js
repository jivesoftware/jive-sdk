var jive = require('jive-sdk');

exports.todoCreator = {
    'path' : '/configure',
    'verb' : 'get',
    'route': function(req, res){
        var conf = jive.service.options;
        res.render('configuration.html', { host: jive.service.serviceURL() });
    }
};

