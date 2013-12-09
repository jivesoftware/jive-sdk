var q = require('q');
var url = require('url');
var util = require('util');
var jive = require('../../api');

exports.refreshTokenFlow = function (oauth2Conf, refreshToken) {
    var postObject = {
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'client_id': oauth2Conf['oauth2ConsumerKey'],
        'client_secret': oauth2Conf['oauth2ConsumerSecret']
    };

    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    return jive.util.buildRequest(oauth2Conf['originServerTokenRequestUrl'], 'POST', postObject, headers);
};

exports.buildOAuthHandler = function( accessTokenRefresher ) {
    var handler = Object.create(require('./oauthHandler'));
    handler['accessTokenRefresher'] = accessTokenRefresher;

    return handler;
};

