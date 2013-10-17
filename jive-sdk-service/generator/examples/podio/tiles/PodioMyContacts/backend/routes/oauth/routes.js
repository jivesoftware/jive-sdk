var sampleOauth = require('./sampleOauth.js');

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

