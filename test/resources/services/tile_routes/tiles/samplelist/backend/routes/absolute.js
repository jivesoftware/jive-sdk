exports.absolute = {
    'verb' : 'get',
    'path' : '/absolute',
    'route' : function(req, res) {
        res.end('absolute');
    }
};

exports.absoluteCapitalVerb = {
    'verb' : 'GET',
    'path' : '/absolute',
    'route' : function(req, res) {
        res.end('absolute');
    }
};