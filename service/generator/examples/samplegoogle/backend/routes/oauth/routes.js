var sampleOauth = require('./sampleOauth.js');
var googleQueryer = require('./googleQueryer.js');

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
    'route' : googleQueryer.handleGoogleQuery
};