exports.absolute = {
    'verb' : 'get',
    'validate' : function (req, res, next) {
      if (req.params.id === 1) {
        return next();
      }
      res.status(400).end('invalid');
    },
    'path' : '/validated/:id',
    'route' : function(req, res) {
        res.end('locked');
    }
};
