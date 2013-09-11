var util = require('util');
var jive = require('jive-sdk');

var myOauth = Object.create(jive.service.routes.oauth);
module.exports = myOauth;

var tokenStore = jive.service.persistence();

/////////////////////////////////////////////////////////////
// overrides jive-sdk/routes/oauth.js to do something useful,
// like storing access token for the viewer

myOauth.fetchOAuth2Conf = function() {
    return jive.service.options['oauth2'];
};

myOauth.oauth2SuccessCallback = function( state, originServerAccessTokenResponse, callback ) {
    console.log('State', state);
    console.log('originServerAccessTokenResponse', originServerAccessTokenResponse);
    tokenStore.save('tokens', state['viewerID'], {
        ticket : state['viewerID'],
        accessToken: originServerAccessTokenResponse['entity']
    }).then( function() {
        callback({'ticket': state['viewerID'] });
    });
};

myOauth.getTokenStore = function() {
    return tokenStore;
};

var oauthUtil = jive.util.oauth;

myOauth.refreshToken = function( refreshToken, viewerID ) {
    oauthUtil.refreshTokenFlow( jive.service.options['oauth2'], refreshToken).then( function (response) {
            //console.log( "RTF: OK")
            tokenStore.save('tokens', viewerID, {
                ticket : viewerID,
                accessToken: response['entity']
            })
        },
        function (error) {
            //console.log( "RTF: NG")
        })
}