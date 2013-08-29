var util = require('util');
var jive = require('jive-sdk');

var sdkInstance = require('jive-sdk/jive-sdk-service/routes/oauth');

var myOauth = Object.create(sdkInstance);

module.exports = myOauth;

var tokenStore = jive.service.persistence();

/////////////////////////////////////////////////////////////
// overrides jive-sdk/routes/oauth.js to do something useful,
// like storing access token for the viewer

myOauth.fetchOAuth2Conf = function() {
    return jive.service.options['oauth2-github'];
};

myOauth.oauth2SuccessCallback = function( state, originServerAccessTokenResponse, callback ) {
    console.log('State', state);
    console.log('originServerAccessTokenResponse', originServerAccessTokenResponse);

    // response from GITHUB is  'access_token=XXXXXXXXX&token_type=bearer'
    var body=originServerAccessTokenResponse.entity.body;
    var idx=body.search("&") ;
    var accessToken = body.substring(13,idx)  ; // just grab the access_token part of the the response
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
