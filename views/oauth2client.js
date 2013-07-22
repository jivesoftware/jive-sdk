function OAuth2ServerFlow( options ) {

    // required
    var serviceHost = options['serviceHost'];
    var grantDOMElementID = options['grantDOMElementID'];
    var ticketErrorCallback = options['ticketErrorCallback'];
    var jiveAuthorizeUrlErrorCallback = options['jiveAuthorizeUrlErrorCallback'];
    var oauth2SuccessCallback = options['oauth2SuccessCallback'];
    var preOauth2DanceCallback = options['preOauth2DanceCallback'];
    var onLoadCallback = options['onLoadCallback'];

    // has defaults
    var authorizeUrl =  options['authorizeUrl'] || serviceHost + '/authorizeUrl';
    var ticketURL =  options['ticketURL'];
    var authz = options['authz'] || 'signed';
    var context = options['context'];
    var extraAuthParams = options['extraAuthParams'];

    var doOAuthDance = function(viewerID, oauth2CallbackUrl) {
        // do any preparation things necessary
        if ( preOauth2DanceCallback ) {
            preOauth2DanceCallback();
        }

        //Fetch the jive callback url - eg. http://server//gadgets/jiveOAuth2Callback
        var url = authorizeUrl + "?callback=" + oauth2CallbackUrl
            + "&ts=" + new Date().getTime() + "&viewerID=" + viewerID;

        // any extra state to inform downstream operations
        if ( context ) {
            url += "&context=" + encodeURIComponent(JSON.stringify(context));
        }

        // any extra auth parameters to attach
        if ( extraAuthParams ) {
            url += "&extraAuthParams=" + encodeURIComponent(JSON.stringify(extraAuthParams));
        }

        //Pre open condition check
        var openCallback = function() {
            return true;
        };

        //Post condition check
        var closeCallback = function() {
            oauth2SuccessCallback(jive.tile.oauthReceivedCallbackTicket_);
        };

        // obtain the oauth url (points to oauth creds store like SFDC)
        osapi.http.get({
            'href' : url,
            'authz': authz,
            'noCache': true
        }).execute(function(response){
            if ( response.status >= 400 && response.status <= 599 ) {
                jiveAuthorizeUrlErrorCallback(response);
                return;
            }

            // pop open oauth url
            var data = response.content;
            $(grantDOMElementID).click(
                jive.tile.openOAuthPopup(
                    JSON.parse(data).url,
                    'width=310,height=600,scrollbars=yes',
                    openCallback, closeCallback
                ).createOpenerOnClick()
            );
        });
    };

    return {
        launch: function() {

            jive.tile.onOpen(function(config, options ) {

                gadgets.window.adjustHeight();
                if ( typeof config === "string" ) {
                    config = JSON.parse(config);
                }

                // state
                var identifiers = jive.tile.getIdentifiers();
                var viewerID = identifiers['viewer'];   // user ID
                var ticket = config["ticketID"]; // may or may not be there
                var oauth2CallbackUrl = jive.tile.getOAuth2CallbackUrl();

                if ( onLoadCallback ) {
                    onLoadCallback( config, identifiers );
                }

                if ( ticketURL ) {
                    //
                    // check ticket state
                    // since a ticket endpoint was provided
                    //
                    osapi.http.get({
                        'href' :  serviceHost + ticketURL + '?' + (
                            ticket ? ('ticketID=' + ticket) : ('viewerID=' + viewerID + "&ts=" + new Date().getTime())
                        ),
                        'format' : 'json',
                        'authz': authz,
                        'noCache': true
                    }).execute( function( response ) {
                        if ( response.status >= 400 && response.status <= 599 ) {
                            ticketErrorCallback(response);
                            return;
                        }

                        var data = response.content;
                        if ( data.status === 'ok' ) {
                            // ticket is still ok
                            // skip authentication
                            ticket = data.ticketID;
                            if ( !ticket ) {
                                doOAuthDance(viewerID, oauth2CallbackUrl);
                            } else {
                                oauth2SuccessCallback();
                            }
                        } else {
                            // ticket is not ok
                            // proceed with authentication
                            doOAuthDance(viewerID, oauth2CallbackUrl);
                        }
                    });

                } else {
                    // proceed with authentication since
                    // there is no ticket endpoint to check for
                    // origin server access token validity.
                    doOAuthDance(viewerID, oauth2CallbackUrl);
                }

            });
        }
    };

}