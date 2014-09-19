var realTile = Boolean(jive.tile);//flag for later usage determination.
jive.tile = jive.tile || {};//if is not defined then define it so that callback ticket can be set internally.
var OAuth2ServerFlow = null;//defined here so it is visible in other files.


if (!gadgets.oauth || !gadgets.oauth.Popup) {
    osapi.jive.core.container.sendNotification({message: 'Use of oauth2client.js requires the oauthpopup feature to be in app.xml. ( &lt;Require feature="oauthpopup"/&gt; )', severity: 'error'});
} else {

    OAuth2ServerFlow = function(options) {

        // required
        var serviceHost = options['serviceHost'];
        var grantDOMElementID = options['grantDOMElementID'];
        var ticketErrorCallback = options['ticketErrorCallback'];
        var jiveAuthorizeUrlErrorCallback = options['jiveAuthorizeUrlErrorCallback'];
        var oauth2SuccessCallback = options['oauth2SuccessCallback'];
        var preOauth2DanceCallback = options['preOauth2DanceCallback'];
        var onLoadCallback = options['onLoadCallback'];
        var jiveOAuth2Dance = options['jiveOAuth2Dance'];

        // has defaults
        var authorizeUrl = options['authorizeUrl'] || serviceHost + '/authorizeUrl';
        var ticketURL = options['ticketURL'];
        var authz = options['authz'] || 'signed';
        var context = options['context'];
        var extraAuthParams = options['extraAuthParams'];
        var popupWindowHeight = options['popupWindowHeight'] || '600';
        var popupWindowWidth = options['popupWindowWidth'] || '400';
        var popupWindowProps = options['popUpWindowProps'];

        var doOAuthDance = function (viewerID, oauth2CallbackUrl, jiveTenantID) {
            // do any preparation things necessary
            if (preOauth2DanceCallback) {
                preOauth2DanceCallback();
            }

            //Fetch the jive callback url - eg. http://server//gadgets/jiveOAuth2Callback
            var url = authorizeUrl + "?callback=" + oauth2CallbackUrl
                + "&ts=" + new Date().getTime() + "&viewerID=" + viewerID;

            if (jiveTenantID && jiveOAuth2Dance) {
                url += "&jiveTenantID=" + jiveTenantID;
            }

            // any extra state to inform downstream operations
            if (context) {
                url += "&context=" + encodeURIComponent(JSON.stringify(context));
            }

            // any extra auth parameters to attach
            if (extraAuthParams) {
                url += "&extraAuthParams=" + encodeURIComponent(JSON.stringify(extraAuthParams));
            }

            //Pre open condition check
            var openCallback = function () {
                return true;
            };

            //Post condition check
            var closeCallback = function () {
                oauth2SuccessCallback(jive.tile.oauthReceivedCallbackTicket_);
            };

            // obtain the oauth url (points to oauth creds store like SFDC)
            osapi.http.get({
                'href': url,
                'authz': authz,
                'noCache': true
            }).execute(function (response) {
                if (response.status >= 400 && response.status <= 599) {
                    jiveAuthorizeUrlErrorCallback(response);
                    return;
                }

                // pop open oauth url
                var data = JSON.parse(response.content);

                $(grantDOMElementID).click(
                    new gadgets.oauth.Popup(data.url,
                            popupWindowProps || ( 'width=' + popupWindowWidth + ',height=' + popupWindowHeight + ',scrollbars=yes'),
                        openCallback, closeCallback
                    ).createOpenerOnClick());

            });
        };

        return {
            launch: function (addOptions) {

                addOptions = addOptions || {};

                var doLaunch = function (config, options) {

                    gadgets.window.adjustHeight();
                    if (typeof config === "string") {
                        config = JSON.parse(config);
                    }

                    // state
                    var identifiers = realTile ? jive.tile.getIdentifiers() : {};
                    var viewerID = addOptions.viewerID || identifiers['viewer'];   // user ID
                    if(!realTile && !viewerID){
                        osapi.jive.core.container.sendNotification({message: 'Apps must pass viewerID into OAuth 2 launch function', severity: 'error'});
                    }
                    var ticket = config["ticketID"]; // may or may not be there
                    var oauth2CallbackUrl = realTile ? jive.tile.getOAuth2CallbackUrl() :
                        function () {
                            var containerUrl = location.href;
                            if (containerUrl && containerUrl.indexOf('/gadgets/ifr') > -1) {
                                containerUrl = containerUrl.substr(0, containerUrl.indexOf('/gadgets/ifr'));
                            }

                            return containerUrl + '/gadgets/jiveOAuth2Callback';
                        }();
                    var jiveTenantID = gadgets.config.get()['jive-opensocial-ext-v1']['jiveTenantID'];

                    if (onLoadCallback) {
                        onLoadCallback(config, identifiers);
                    }

                    if (ticketURL) {
                        //
                        // check ticket state
                        // since a ticket endpoint was provided
                        //
                        osapi.http.get({
                            'href': serviceHost + ticketURL + '?' + (
                                ticket ? ('ticketID=' + ticket) : ('viewerID=' + viewerID + "&ts=" +
                                    new Date().getTime())
                                ),
                            'format': 'json',
                            'authz': authz,
                            'noCache': true
                        }).execute(function (response) {
                            if (response.status >= 400 && response.status <= 599) {
                                if (ticketErrorCallback) {
                                    ticketErrorCallback(response);
                                }
                                return;
                            }

                            var data = response.content;
                            if (data.status === 'ok') {
                                // ticket is still ok
                                // skip authentication
                                ticket = data.ticketID;
                                if (!ticket) {
                                    doOAuthDance(viewerID, oauth2CallbackUrl, jiveTenantID);
                                }
                                else {
                                    oauth2SuccessCallback();
                                }
                            }
                            else {
                                // ticket is not ok
                                // proceed with authentication
                                doOAuthDance(viewerID, oauth2CallbackUrl, jiveTenantID);
                            }
                        });

                    }
                    else {
                        // proceed with authentication since
                        // there is no ticket endpoint to check for
                        // origin server access token validity.
                        doOAuthDance(viewerID, oauth2CallbackUrl, jiveTenantID);
                    }

                };
                if (realTile) {
                    jive.tile.onOpen(doLaunch);
                }
                else {
                    doLaunch(addOptions, addOptions);
                }
            }
        };

    }
}