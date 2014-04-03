var sfdcQueryer = require('./sfdcQueryer.js');

exports.query = {
    'verb' : 'get',
    'path' : '/{{{TILE_NAME_BASE}}}/salesforce/query',
    'route' : sfdcQueryer.handleSfdcQuery
};