var ticketErrorCallback = function() {
    alert('ticketErrorCallback error');
};

var jiveAuthorizeUrlErrorCallback = function() {
    alert('jiveAuthorizeUrlErrorCallback error');
};


var preOauth2DanceCallback = function() {
    //debugger;
    $("#j-card-authentication").show();
    $("#j-card-action").hide();
    gadgets.window.adjustHeight(400);

    var config = onLoadContext['config'];

    if (typeof config === 'string')
    {
        config = JSON.parse(config) ;
    }

    //$("#projectA").text(config.project) ;
   // $("#decriptionA").text(config.description);
    //$("#BasecampLinkA").attr( "href", config.url)  ;
};

var onLoadCallback = function( config, identifiers ) {
    onLoadContext = {
        config: config,
        identifiers : identifiers
    };
};
function doIt( host ) {

    // research - jQuery doesn't like cards that have the same ids .. there is probably a better way
    // than how I did it here!

    var qTicketID;

    gadgets.window.adjustHeight(400);

    var oauth2SuccessCallback = function(ticketID) {

        // If we are here, we have been successfully authenticated and now can display some useful data ...

        //debugger;
        $("#j-card-authentication").hide();
        $("#j-card-action").show();

        // how do we resize after adding stuff?
        gadgets.window.adjustHeight(700);  // do this here in case preOauth2DanceCallback wasn't called

        //debugger;
        var identifiers = jive.tile.getIdentifiers();
        var viewerID = identifiers['viewer'];   // user ID
        // handle the case of a callback with no ticketID passed .. this happens if
        // we verified that the viewer ID already has a valid token without doing the OAuth2 dance ...
        if (ticketID == undefined)    ticketID = viewerID;
        qTicketID = ticketID;       // save globally for comments, close, and other actions ....
        //alert( "Success! ticketID="+ticketID );

        var config = onLoadContext['config'];

        if (typeof config === 'string')
        {
            config = JSON.parse(config) ;
        }
        //debugger;

        $("#projectB").text(config.name) ;
        $("#descriptionB").text(config.description);
        $("#BasecampLinkB").attr( "href", config.url)  ;

        gadgets.window.adjustHeight();

    }    // end OAuth2SuccessCallback ...

    // 'host' was defined, now replaced by a hardcoded one for now ...
    var options = {
        serviceHost : host,
        grantDOMElementID : '#oauth',
        ticketErrorCallback : ticketErrorCallback,
        jiveAuthorizeUrlErrorCallback : jiveAuthorizeUrlErrorCallback,
        oauth2SuccessCallback : oauth2SuccessCallback,
        preOauth2DanceCallback : preOauth2DanceCallback,
        onLoadCallback : onLoadCallback,
        authorizeUrl : host + '/{{{TILE_NAME}}}/oauth/authorizeUrl',
        ticketURL: '/oauth/isAuthenticated',
        extraAuthParams: {
            type: 'web_server'
        }
    };

    $("#btn_done").click( function() {
        jive.tile.close(null, {} );
    });
    $("#btn_doneA").click( function() {
        jive.tile.close(null, {} );
    });

    //debugger;
    OAuth2ServerFlow( options ).launch();
//        });
//    });


}  ;