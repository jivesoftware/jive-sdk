var sampleOauth = require('./sampleOauth.js');
var podioQueryer = require('./podioQueryer.js');

exports.authorizeUrl = {
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/authorizeUrl',
    'verb' : 'get',
    'route': sampleOauth.authorizeUrl.bind(sampleOauth)
};

exports.oauth2Callback = {
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/oauth2Callback',
    'verb' : 'get',
    'route': sampleOauth.oauth2Callback.bind(sampleOauth)
};


exports.isAuthenticated = {
    'path'  : '/{{{TILE_NAME_BASE}}}/oauth/isAuthenticated',
    'verb' : 'get',
    'route' : podioQueryer.isAuthenticated
};

exports.getProjectInfo = {
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/getProjectInfo'  ,
    'verb' : 'get',
    'route' : podioQueryer.getProjectInfo
};

