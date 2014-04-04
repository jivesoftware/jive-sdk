var sampleOauth = require('./sampleOauth.js');
var gitHubQueryer = require('./githubQueryer.js');

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
    'route' : gitHubQueryer.handleGitHubQuery
};

exports.post = {
    'verb' : 'post',
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/post',
    'route' : gitHubQueryer.handleGitHubPost
};

exports.isAuthenticated = {
    'path' : '/{{{TILE_NAME_BASE}}}/oauth/isAuthenticated',
    'verb' : 'get',
    'route' : gitHubQueryer.isAuthenticated
};

