var sampleOauth = require('./sampleOauth.js');
var googleQueryer = require('./googleQueryer.js');

exports.authorizeUrl = {
    'verb' : 'get',
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/authorizeUrl',
    'route': sampleOauth.authorizeUrl.bind(sampleOauth)
};

exports.oauth2Callback = {
    'verb' : 'get',
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/oauth2Callback',
    'route': sampleOauth.oauth2Callback.bind(sampleOauth)
};

exports.query = {
    'verb' : 'get',
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/query',
    'route' : googleQueryer.handleGoogleQuery
};