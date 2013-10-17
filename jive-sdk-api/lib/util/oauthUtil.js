var q = require('q');
var url = require('url');
var util = require('util');
var jive = require('../../api');
var tileClient = require('../tile/client');
var community = require('../community/community');

/**
 * Requests an access token by oauth access code (oauth access code is given in registration requests and valid for few minutes).
 * @param jiveUrl - the url of the jive community. this function will use this url to find the community in the persistence and get the client id and secret.
 * @param oauthCode - the code needed to be use to get access to a specific registration scope (usually a group).
 * @returns a promise for success and failure [use .then(...) and .catch(...)]
 */
exports.requestAccessToken = function (jiveUrl, oauthCode) {
    var defer = q.defer();

    community.findByJiveURL(jiveUrl)
        .then(function (communityObj) {
            if (communityObj) {
                var oauthConf = {
                    client_id: communityObj.clientId,
                    client_secret: communityObj.clientSecret,
                    code: oauthCode,
                    jiveUrl: jiveUrl
                };
                tileClient.requestAccessToken(oauthConf, defer.resolve, defer.reject);
            }
            else {
                defer.reject(new Error("No community found by the url: " + jiveUrl));
            }
        })
        .catch(defer.reject);

    return defer.promise;
};

exports.buildAuthorizeUrlResponseMap = function (oauth2Conf, callback, context, extraAuthParams) {
    var stateToEncode = { 'jiveRedirectUrl': callback };
    if (context) {
        stateToEncode = util._extend(stateToEncode, context);
    }

    var url  = oauth2Conf['originServerAuthorizationUrl'] + "?" +
        "state="            + jive.util.base64Encode(JSON.stringify(stateToEncode)) +
        "&redirect_uri="    + oauth2Conf['clientOAuth2CallbackUrl'] +
        "&client_id="       + oauth2Conf['oauth2ConsumerKey'] +
        "&response_type="   + "code";

    if ( extraAuthParams ) {
        var extraAuthStr = '';
        for (var key in extraAuthParams) {
            if (extraAuthParams.hasOwnProperty(key)) {
                extraAuthStr += '&' + key + '=' + extraAuthParams[key];
            }
        }

        url += extraAuthStr;
    }

    return {
        'url' : url
    };
};

exports.buildOauth2CallbackObject = function(oauth2Conf, code, extraParams ) {

    var postObject = {
        'grant_type'        : 'authorization_code',
        'redirect_uri'      : oauth2Conf['clientOAuth2CallbackUrl'],
        'client_id'         : oauth2Conf['oauth2ConsumerKey'],
        'client_secret'     : oauth2Conf['oauth2ConsumerSecret'],
        'code'              : code
    };

    if ( extraParams ) {
        postObject = util._extend(postObject, extraParams);
    }

    return postObject;
};

exports.refreshTokenFlow = function(oauth2Conf, refreshToken) {
    var postObject = {
        'grant_type'        : 'refresh_token',
        'refresh_token'     : refreshToken,
        'client_id'         : oauth2Conf['oauth2ConsumerKey'],
        'client_secret'     : oauth2Conf['oauth2ConsumerSecret']
    };

    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    return jive.util.buildRequest( oauth2Conf['originServerTokenRequestUrl'], 'POST', postObject, headers);
};

