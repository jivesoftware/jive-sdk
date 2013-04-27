var url = require('url');
var util = require('util');
var jive = require('../api');

exports.buildAuthorizeUrlResponseMap = function( oauth2Conf, callback, context ) {
    var stateToEncode = { 'jiveRedirectUrl' : callback };
    if ( context ) {
        stateToEncode = util._extend(stateToEncode, context);
    }

    var clientUrl = jive.service.options['clientUrl'] + ':' + jive.service.options['port'];
    var redirectUrl = process.env['jive_oauth2_redirect'] || encodeURIComponent(clientUrl + '/oauth2Callback');
    var oauth2AuthorizePath = oauth2Conf['oauth2AuthorizePath'];
    var oauth2ConsumerKey = oauth2Conf['oauth2ConsumerKey'];
    var originServerAuthorizationUrl = oauth2Conf['originServerAuthorizationUrl'];

    return {
        'url' :  originServerAuthorizationUrl + "?" +
            "state=" + jive.util.base64Encode(JSON.stringify(stateToEncode)) +
            "&redirect_uri=" + redirectUrl +
            "&client_id=" + oauth2ConsumerKey +
            "&response_type=code"
    };
};

exports.buildOauth2CallbackObject = function(oauth2Conf, code, extraParams ) {

    var clientUrl = jive.service.options['clientUrl'] + ':' + jive.service.options['port'];
    var redirectUrl =  process.env['jive_oauth2_redirect'] || encodeURIComponent( clientUrl + '/oauth2Callback' );

    var postObject = {
        'grant_type'        : 'authorization_code',
        'client_id'         : oauth2Conf['oauth2ConsumerKey'],
        'client_secret'     : oauth2Conf['oauth2ConsumerSecret'],
        'redirect_uri'      : redirectUrl,
        'code'              : code
    };

    if ( extraParams ) {
        postObject = util._extend(postObject, extraParams);
    }

    return postObject;
};

