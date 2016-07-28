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

/**
 * @module oauthRoutes
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var http = require('http');
var url = require('url');
var jive = require('../api');
var consolidate = require('consolidate');
var mustache = consolidate.mustache;
var q = require('q');
var util = require("util");

exports.redirectHtmlTxt = "<html> <head> <script> window.location='{{{redirect}}}'; </script>" +
    "</head> <body> Redirecting ... </body> </html>";

exports.fetchOAuth2Conf = function() {
    return jive.service.options['oauth2'];
};

function getOAuth2Conf(targetJiveTenantID, originJiveTenantID, self) {
    var deferred = q.defer();

    if ( targetJiveTenantID ) {
        jive.community.findByTenantID(targetJiveTenantID).then( function( community ) {
            if ( community ) {
                try{
                    var oauth2Conf = JSON.parse( JSON.stringify(self.fetchOAuth2Conf( {
                        'originJiveTenantID' : originJiveTenantID,
                        'targetJiveTenantID' : targetJiveTenantID
                    }) || {} ) );
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
                deferred.reject(new Error("Could not find community for tenantID " + targetJiveTenantID ));
            }
        });

    } else {
        deferred.resolve( self.fetchOAuth2Conf({
            'originJiveTenantID' : originJiveTenantID,
            'targetJiveTenantID' : targetJiveTenantID
        }) );
    }

    return deferred.promise;
}

/**
 * <h5>Route:</h5>
 * <i>GET /authorizeUrl</i>
 * <br><br>
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
    var targetJiveTargetID = query['jiveTenantID'];
    var jiveExtensionHeaders = jive.util.request.parseJiveExtensionHeaders(req);
    if (jiveExtensionHeaders ) {
        var originJiveTenantID = jiveExtensionHeaders['tenantID'];
        jive.logger.debug('Origin jive tenantID', originJiveTenantID);
    }

    var contextStr = query['context'];
    if ( contextStr ) {
        try {
            var context = JSON.parse( decodeURI(contextStr) );
        } catch (e) {
            errorResponse( res, 400, 'Invalid context string, could not parse');
            return;
        }
    }

    // encode the target jiveTenantID in the context
    if ( targetJiveTargetID ) {
        context = context || {};
        context['jiveTenantID'] = targetJiveTargetID ;
    }

    // encode the origin jiveTenantID in the context
    if ( originJiveTenantID ) {
        context = context || {};
        context['originJiveTenantID'] = originJiveTenantID;
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
    var self = this;
    getOAuth2Conf(targetJiveTargetID, originJiveTenantID, this ).then( function(oauth2Conf) {
        var responseMap = self.buildAuthorizeUrlResponseMap(
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


/**
 * Override this in a subclass!
 * @param oauth2CallbackRequest
 * @param originServerAccessTokenResponse
 * @param callback
 */
exports.oauth2FailureCallback = function(  res, code, error ) {
    errorResponse( res, code, error );
};

var errorResponse = function( res, code, error ){
    res.status(code);
    res.set({'Content-Type': 'application/json'});
    var err = {'error': error};
    res.send(JSON.stringify(err));
    responseSent = true;
    jive.logger.debug(err);
};

/**
 * <h4><i>POST /oauth2Callback</i></h4>
 * <br>
 * Expects:
 * - code
 * - state, which is a base64 encoded JSON structure containing at minimum jiveRedirectUrl attribute
 * @param req
 * @param res
 */
exports.oauth2Callback = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var self = this;
    var oauth2FailureCallback = self.oauth2FailureCallback;

    var code = query['code'];
    if ( !code ) {
        var msg = 'Authorization code required';
        jive.logger.warn('oauth2Callback failed', res, 400, msg);
        oauth2FailureCallback( res, 400, msg);
        return;
    }

    var stateStr = query['state'];
    if ( !stateStr ) {
        var msg = 'Missing state string';
        jive.logger.warn('oauth2Callback failed', res, 400, msg);
        oauth2FailureCallback( res, 400, msg);
        return;
    }

    try {
        var state = JSON.parse( JSON.parse( jive.util.base64Decode(stateStr)) );
    } catch ( e ) {
        var msg = 'Invalid state string, cannot parse.';
        jive.logger.warn('oauth2Callback failed', res, 400, msg);
        oauth2FailureCallback( res, 400, msg);
        return;
    }

    var jiveRedirectUrl = state['jiveRedirectUrl'];
    if ( !jiveRedirectUrl ) {
        var msg = 'Invalid state string, no jiveRedirectUrl provided.';
        jive.logger.warn('oauth2Callback failed', res, 400, msg);
        oauth2FailureCallback( res, 400, msg);
        return;
    }

    var jiveTenantID = state['context'] ? state['context']['jiveTenantID'] : undefined;
    var originJiveTenantID = state['context'] ? state['context']['originJiveTenantID'] : undefined;

    getOAuth2Conf(jiveTenantID, originJiveTenantID, this).then(

        /////////////
        function(oauth2Conf) {

            var oauth2CallbackExtraParams = oauth2Conf['oauth2CallbackExtraParams'];

            var postObject = self.buildOauth2CallbackObject( oauth2Conf, code, oauth2CallbackExtraParams );
            jive.logger.debug("Post object", postObject);

            var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

            var proceed = function(context, error) {
                if (error) {
                    jive.logger.error('oauth2Callback failed', res, 500, error);
                    oauth2FailureCallback(res, 500, error);
                    return;
                }

                var redirectParams = '';

                if (context && typeof context === 'object') {
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

                mustache.render(self.redirectHtmlTxt, { 'redirect': redirect })
                .then(
                  function(processed) {
                    res.status(200);
                    res.set({'Content-Type': 'text/html'});
                    res.send(processed);
                  } // end function
                );
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
                    jive.logger.error('oauth2Callback failed', res, 500, e);
                    oauth2FailureCallback( res, 500, e);
                }
            ).catch(function(e){
                jive.logger.error('oauth2Callback failed', res, 500, e);
                oauth2FailureCallback(res,500,e);
            });


        },

        /////////////
        function(err) {
            oauth2FailureCallback( res, 500, err);
        }
    );

};

exports.buildAuthorizeUrlResponseMap = function (oauth2Conf, callback, context, extraAuthParams) {
    var stateToEncode = { 'jiveRedirectUrl': callback };
    if (context) {
        stateToEncode = util._extend(stateToEncode, context);
    }

    var redirectUri = oauth2Conf['clientOAuth2CallbackUrl'];
    if (redirectUri.substring(0,1) == "/") {
       redirectUri = jive.service.serviceURL() + redirectUri;
    } // end if

    var url = oauth2Conf['originServerAuthorizationUrl'] + "?" +
        "state=" + jive.util.base64Encode(JSON.stringify(stateToEncode)) +
        "&redirect_uri=" + encodeURIComponent(redirectUri) +
        "&client_id=" + oauth2Conf['oauth2ConsumerKey'] +
        "&response_type=" + "code";

    if (oauth2Conf['oauth2Scope']) {
        url += "&scope=" + encodeURIComponent(oauth2Conf['oauth2Scope']);
    } // end if

    if (extraAuthParams) {
        var extraAuthStr = '';
        for (var key in extraAuthParams) {
            if (extraAuthParams.hasOwnProperty(key)) {
                extraAuthStr += '&' + key + '=' + extraAuthParams[key];
            }
        }

        url += extraAuthStr;
    }

    return {
        'url': url
    };
};

exports.buildOauth2CallbackObject = function (oauth2Conf, code, extraParams) {

    var redirectUri = oauth2Conf['clientOAuth2CallbackUrl'];
    if (redirectUri.substring(0,1) == "/") {
       redirectUri = jive.service.serviceURL() + redirectUri;
    } // end if

    var postObject = {
        'grant_type': 'authorization_code',
        'redirect_uri': redirectUri,
        'client_id': oauth2Conf['oauth2ConsumerKey'],
        'client_secret': oauth2Conf['oauth2ConsumerSecret'],
        'code': code
    };

    if (extraParams) {
        postObject = util._extend(postObject, extraParams);
    }

    return postObject;
};
