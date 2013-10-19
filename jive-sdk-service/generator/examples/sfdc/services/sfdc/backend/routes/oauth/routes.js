var sfdcQueryer = require('./sfdcQueryer.js');

exports.query = {
    'verb' : 'get',
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/query',
    'route' : sfdcQueryer.handleSfdcQuery
};