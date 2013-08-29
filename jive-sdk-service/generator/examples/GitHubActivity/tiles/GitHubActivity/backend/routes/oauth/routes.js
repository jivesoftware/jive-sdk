var sampleOauth = require('./sampleOauth.js');
var gitHubQueryer = require('./githubQueryer.js');

exports.authorizeUrl = {
    'verb' : 'get',
    'route': sampleOauth.authorizeUrl.bind(sampleOauth)
};

exports.oauth2Callback = {
    'verb' : 'get',
    'route': sampleOauth.oauth2Callback.bind(sampleOauth)
};

exports.query = {
    'verb' : 'get',
    'route' : gitHubQueryer.handleGitHubQuery
};

exports.post = {
    'verb' : 'post',
    'route' : gitHubQueryer.handleGitHubPost
};

exports.isAuthenticated = {
    'path'  : '/oauth/isAuthenticated',
    'verb' : 'get',
    'route' : gitHubQueryer.isAuthenticated
}

