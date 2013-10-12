/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var http = require('http');
var url = require('url');
var jive = require('../api');
var mustache = require('mustache');
var q = require('q');

var oauthUtil = jive.oauthUtil;

exports.redirectHtmlTxt = "<html> <head> <script> window.location='{{{redirect}}}'; </script>" +
    "</head> <body> Redirecting ... </body> </html>";

exports.fetchOAuth2Conf = function() {
    return jive.service.options['oauth2'];
};

function getOAuth2Conf(jiveTenantID, self) {
    var deferred = q.defer();

    if ( jiveTenantID ) {
        jive.community.findByTenantID( jiveTenantID).then( function( community ) {
            if ( community ) {
                try{
                    var oauth2Conf = JSON.parse( JSON.stringify(self.fetchOAuth2Conf() || {} ) );
                } catch ( e ) {
                    deferred.reject(e);
                    return;
                }
                oauth2Conf['oauth2ConsumerKey'] = community['clientId'];
                oauth2Conf['oauth2ConsumerSecret'] = community['clientSecret'];
                oauth2Conf['originServerAuthorizationUrl'] = community['jiveUrl'] + '/oauth2/authorize';
                oauth2Conf['originServerTokenRequestUrl'] = community['jiveUrl'] + '/oauth2/token';

                deferred.resolve( oauth2Conf );
            } else {
                deferred.reject(new Error("Could not find community for tenantID " + jiveTenantID ));
            }
        });

    } else {
        deferred.resolve( self.fetchOAuth2Conf() );
    }

    return deferred.promise;
}

/**
 * Expects:
 * - viewerID
 * - callback
 * - base64 encoded Authorization header
 * @param req
 * @param res
 */
exports.authorizeUrl = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var viewerID = query['viewerID'];
    var callback = query['callback'];
    var jiveTenantID = query['jiveTenantID'];

    var contextStr = query['context'];
    if ( contextStr ) {
        try {
            var context = JSON.parse( decodeURI(contextStr) );
        } catch (e) {
            errorResponse( res, 400, 'Invalid context string, could not parse');
            return;
        }
    }

    // encode the jiveTenantID in the context
    if ( !context && jiveTenantID ) {
        context = { 'jiveTenantID' : jiveTenantID };
    }

    var extraAuthParamsStr = query['extraAuthParams'];
    if ( extraAuthParamsStr ) {
        try {
            var extraAuthParams = JSON.parse( decodeURI(extraAuthParamsStr ));
        } catch (e) {
            errorResponse( res, 400, 'Invalid extra auth param string, could not parse');
            return;
        }
    }
    getOAuth2Conf(jiveTenantID, this).then( function(oauth2Conf) {
        var responseMap = oauthUtil.buildAuthorizeUrlResponseMap(
            oauth2Conf, callback, { 'viewerID': viewerID, 'context': context}, extraAuthParams );

        jive.logger.debug('Sending', responseMap);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end( JSON.stringify(responseMap) );
    }, function(err) {
        errorResponse( res, 404, err);
    });
};

/**
 * Override this in a subclass!
 * @param oauth2CallbackRequest
 * @param originServerAccessTokenResponse
 * @param callback
 */
exports.oauth2SuccessCallback = function( state, originServerAccessTokenResponse, callback ) {
    jive.logger.debug('State', state);
    jive.logger.debug('Origin server Access Token Response', originServerAccessTokenResponse);
    callback();
};

var errorResponse = function( res, code, error ){
    res.status(code);
    res.set({'Content-Type': 'application/json'});
    var err = {'error':error};
    res.send( JSON.stringify(err) );
    jive.logger.debug(err);
};

/**
 * Expects:
 * - code
 * - state, which is a base64 encoded JSON structure containing at minimum jiveRedirectUrl attribute
 * @param req
 * @param res
 */
exports.oauth2Callback = function(req, res ) {
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

    var jiveTenantID = state['context'] ? state['context']['jiveTenantID'] : undefined;
    var self = this;

    getOAuth2Conf(jiveTenantID, this).then(

        /////////////
        function(oauth2Conf) {

            var oauth2CallbackExtraParams = oauth2Conf['oauth2CallbackExtraParams'];

            var postObject = oauthUtil.buildOauth2CallbackObject( oauth2Conf, code, oauth2CallbackExtraParams );
            jive.logger.debug("Post object", postObject);

            var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

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

            var oauth2SuccessCallback = self.oauth2SuccessCallback;

            jive.util.buildRequest( oauth2Conf['originServerTokenRequestUrl'], 'POST', postObject, headers).then(
                function(response) {
                    // success
                    if ( response.statusCode >= 200 && response.statusCode < 299 ) {
                        if (oauth2SuccessCallback) {
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


        },

        /////////////
        function(err) {
            errorResponse( res, 500, err);
        }
    );

};

