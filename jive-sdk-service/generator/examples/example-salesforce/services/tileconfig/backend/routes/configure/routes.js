var jive = require("jive-sdk");

exports.configure = {
    'verb' : 'get',
    'path' : '/{{{TILE_NAME_BASE}}}/configure',
    'route': function(req, res){
        var conf = jive.service.options;
        res.render('configuration.html', { host: jive.service.serviceURL() });
    }
};
