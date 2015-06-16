var jive = require('jive-sdk');

exports.last = {
    'verb' : 'get',
    'route': function(req, res) {
        res.writeHead(200);
        var random = Math.round(Math.random() * 2499) + 1;
        jive.logger.info('last request duration: ' + random)
        res.end('' + random);
    }
};