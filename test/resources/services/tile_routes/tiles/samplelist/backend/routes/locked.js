exports.absolute = {
    'verb' : 'get',
    'jiveLocked' : true,
    'path' : '/locked',
    'route' : function(req, res) {
        res.end('locked');
    }
};