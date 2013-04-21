var http = require('http');
var url = require('url');
var jive = require('../api');

var oauthUtil = require('../lib/oauthUtil');

exports.fetchOAuth2Conf = function() {
    return jive.service.options['oauth2'];
};

/**
 * Expects:
 * - viewerID
 * - callback
 * @param req
 * @param res
 */
exports.authorizeUrl = function(req, res ) {
    var oauth2Conf = this.fetchOAuth2Conf();

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var viewerID = query['viewerID'];
    var callback = query['callback'];

    var responseMap = oauthUtil.buildAuthorizeUrlResponseMap(
        oauth2Conf, callback, { 'viewerID': viewerID } );

    console.log('Sending', responseMap);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end( JSON.stringify(responseMap) );

};

/**
 * Override this in a subclass!
 * @param oauth2CallbackRequest
 * @param originServerAccessTokenResponse
 * @param callback
 */
exports.oauth2SuccessCallback = function( state, originServerAccessTokenResponse, callback ) {
    console.log(state);
    console.log(originServerAccessTokenResponse);
    callback();
};

/**
 * Expects:
 * - code
 * - encoded state
 * @param req
 * @param res
 */
exports.oauth2Callback = function(req, res ) {
    var oauth2Conf = this.fetchOAuth2Conf();

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var code = query['code'];
    var state = JSON.parse( JSON.parse( jive.util.base64Decode(query['state'])) );
    var jiveRedirectUrl = state['jiveRedirectUrl'];

    var postObject = oauthUtil.buildOauth2CallbackObject( oauth2Conf, code );
    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    var proceed = function(context) {
        var contextStr = '';

        if ( context && typeof context === 'object' ) {
            for (var key in context) {
                if (context.hasOwnProperty(key)) {
                    if (contextStr.length > 0) {
                        contextStr += '&';
                    }
                    contextStr += encodeURIComponent(key) + '=' + encodeURIComponent(context[key]);
                }
            }
        }

        var redirect = decodeURIComponent(jiveRedirectUrl) + ( contextStr ? '?' : '') + contextStr;
        res.render('oauth2Redirect.html', { 'redirect' : redirect } );
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
            res.status(500);
            res.set({'Content-Type': 'application/json'});
            res.send();
        }
    );

};

