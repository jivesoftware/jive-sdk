var sampleOauth = require('./sampleOauth.js');
var podioQueryer = require('./podioQueryer.js')

exports.authorizeUrl = {
    'verb' : 'get',
    'route': sampleOauth.authorizeUrl.bind(sampleOauth)
};

exports.oauth2Callback = {
    'verb' : 'get',
    'route': sampleOauth.oauth2Callback.bind(sampleOauth)
};
exports.isAuthenticated = {
    'path'  : '/oauth/isAuthenticated',
    'verb' : 'get',
    'route' : podioQueryer.isAuthenticated
};
exports.getProjectInfo = {
    'path' : '/oauth/getProjectInfo'  ,
    'verb' : 'get',
    'route' : podioQueryer.getProjectInfo
}
