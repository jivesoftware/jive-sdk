var util = require('util');
var jive = require('jive-sdk');
var url = require('url');
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
