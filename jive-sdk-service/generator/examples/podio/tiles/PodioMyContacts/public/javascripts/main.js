var ticketErrorCallback = function() {
    alert('ticketErrorCallback error');
};

var jiveAuthorizeUrlErrorCallback = function() {
    alert('jiveAuthorizeUrlErrorCallback error');
};


var preOauth2DanceCallback = function() {
    $("#j-card-authentication").show();
    $("#j-card-configuration").hide();
    gadgets.window.adjustHeight(200);
};

var onLoadCallback = function( config, identifiers ) {
    onLoadContext = {
        config: config,
        identifiers : identifiers
    };
};

function doIt( host ) {

    var oauth2SuccessCallback = function(ticketID) {
        // do configuration
        $("#j-card-authentication").hide();
        $("#j-card-configuration").show();

        $("#btn_done").click( function() {
            var toReturn = {
                "data" : {}
            };
            console.log("toreturn", toReturn);
            if ( ticketID ) {
                toReturn['ticketID'] = ticketID;
            }

            jive.tile.close(toReturn );
        });
    };

    var options = {
        serviceHost : host,
        grantDOMElementID : '#oauth',
        ticketErrorCallback : ticketErrorCallback,
        jiveAuthorizeUrlErrorCallback : jiveAuthorizeUrlErrorCallback,
        oauth2SuccessCallback : oauth2SuccessCallback,
        preOauth2DanceCallback : preOauth2DanceCallback,
        onLoadCallback : onLoadCallback,
        authorizeUrl : host + '/{{{TILE_NAME_BASE}}}/oauth/authorizeUrl',
        extraAuthParams: {
            scope: encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')
        }
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    OAuth2ServerFlow( options ).launch();
}
