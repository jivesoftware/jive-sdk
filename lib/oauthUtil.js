var url = require('url');
var util = require('util');
var jive = require('../api');

exports.buildAuthorizeUrlResponseMap = function( oauth2Conf, callback, context, extraAuthParams ) {
    var stateToEncode = { 'jiveRedirectUrl' : callback };
    if ( context ) {
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
        'client_id'         : oauth2Conf['oauth2ConsumerKey'],
        'client_secret'     : oauth2Conf['oauth2ConsumerSecret'],
        'redirect_uri'      : oauth2Conf['clientOAuth2CallbackUrl'],
        'code'              : code
    };

    if ( extraParams ) {
        postObject = util._extend(postObject, extraParams);
    }

    return postObject;
};

