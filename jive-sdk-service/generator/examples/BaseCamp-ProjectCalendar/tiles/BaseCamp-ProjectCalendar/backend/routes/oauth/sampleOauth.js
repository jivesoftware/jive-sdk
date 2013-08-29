var util = require('util');
var jive = require('jive-sdk');
var url = require('url');
var oauthUtil = require("jive-sdk/jive-sdk-api/lib/util/oauthUtil");
var mustache = require('mustache');

var sdkInstance = require('jive-sdk/jive-sdk-service/routes/oauth');

var myOauth = Object.create(sdkInstance);

module.exports = myOauth;

var tokenStore = jive.service.persistence();

/////////////////////////////////////////////////////////////
// overrides jive-sdk/routes/oauth.js to do something useful,
// like storing access token for the viewer

myOauth.fetchOAuth2Conf = function() {
    return jive.service.options['oauth2-basecamp'];
};

myOauth.oauth2SuccessCallback = function( state, originServerAccessTokenResponse, callback ) {
    console.log('State', state);
    console.log('originServerAccessTokenResponse', originServerAccessTokenResponse);

    // response from Basecamp is  'access_token=XXXXXXXXX&refresh_token=YYYYYYYY&expires_in=ZZZZZZ'
    // these are all in the 'entity' object, there is no body part
    var accessToken=originServerAccessTokenResponse.entity.access_token;

    // note: we could also be saving refresh tokes and expires_in data ..
    tokenStore.save('tokens', state['viewerID'], {
        ticket : state['viewerID'],
        accessToken: accessToken
    }).then( function() {
            callback({'ticket': state['viewerID'] });
        });
};

myOauth.getTokenStore = function() {
    return tokenStore;
};
/**
 * Expects:
 * - code
 * - state, which is a base64 encoded JSON structure containing at minimum jiveRedirectUrl attribute
 * @param req
 * @param res
 */

/////////////////////////////////////////////////////////////
// overrides jive-sdk/routes/oauth.js to include the 'type=web_server' URL param that is
// required by Basecamp

myOauth.oauth2Callback = function(req, res ) {
    var oauth2Conf = this.fetchOAuth2Conf();

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var code = query['code'];
    if ( !code ) {
        errorResponse( res, 400, 'Authorization code required');
        return;
    }

    var stateStr = query['state'];
    if ( !stateStr ) {
        errorResponse( res, 400, 'Missing state string');
        return;
    }

    try {
        var state = JSON.parse( JSON.parse( jive.util.base64Decode(stateStr)) );
    } catch ( e ) {
        errorResponse( res, 400, 'Invalid state string, cannot parse.');
        return;
    }

    var jiveRedirectUrl = state['jiveRedirectUrl'];
    if ( !jiveRedirectUrl ) {
        errorResponse( res, 400, 'Invalid state string, no jiveRedirectUrl provided.');
        return;
    }

    var postObject = oauthUtil.buildOauth2CallbackObject( oauth2Conf, code );

    // need to add in this extra parameter as the base class doesn't provide for this ...
    var extraParams = { 'type' : 'web_server'} ;
    postObject = util._extend(postObject, extraParams);

    jive.logger.debug("Post object", postObject);

    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    var self = this;
    var proceed = function(context) {
        var redirectParams = '';

        if ( context && typeof context === 'object' ) {
            for (var key in context) {
                if (context.hasOwnProperty(key)) {
                    if (redirectParams.length > 0) {
                        redirectParams += '&';
                    }
                    redirectParams += encodeURIComponent(key) + '=' + encodeURIComponent(context[key]);
                }
            }
        }

        var redirect = decodeURIComponent(jiveRedirectUrl) + ( redirectParams ? '?' : '') + redirectParams;
        var redirectHtml = mustache.render( self.redirectHtmlTxt, { 'redirect' : redirect } );

        res.status(200);
        res.set({'Content-Type': 'text/html'});
        res.send(redirectHtml);
    };

    var oauth2SuccessCallback = this.oauth2SuccessCallback;

    jive.util.buildRequest( oauth2Conf['originServerTokenRequestUrl'], 'POST', postObject, headers).then(
        function(response) {
            // success
            if ( response.statusCode >= 200 && response.statusCode < 299 ) {
                if (  oauth2SuccessCallback ) {
                    oauth2SuccessCallback( state, response, proceed );
                } else {
                    proceed();
                }
            } else {
                res.status(response.statusCode);
                res.set({'Content-Type': 'application/json'});
                res.send(response.entity);
            }
        },
        function(e) {
            // failure
            errorResponse( res, 500, e);
        }
    );

};