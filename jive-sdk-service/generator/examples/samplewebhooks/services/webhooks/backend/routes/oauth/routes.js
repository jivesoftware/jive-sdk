var sampleOauth = require('./sampleOauth.js');

exports.authorizeUrl = {
    'path' : '/oauth/authorizeUrl',
    'verb' : 'get',
    'route': sampleOauth.authorizeUrl.bind(sampleOauth)
};

exports.oauth2Callback = {
    'path' : '/oauth/oauth2Callback',
    'verb' : 'get',
    'route': sampleOauth.oauth2Callback.bind(sampleOauth)
};

