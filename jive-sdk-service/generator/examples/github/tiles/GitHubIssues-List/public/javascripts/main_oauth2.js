 var ticketErrorCallback = function() {
    alert('ticketErrorCallback error');
};

var jiveAuthorizeUrlErrorCallback = function() {
    alert('jiveAuthorizeUrlErrorCallback error');
};

var preOauth2DanceCallback = function() {
    $("#j-card-authentication").show();
    $("#j-card-configuration").hide();
    gadgets.window.adjustHeight(350);
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
        gadgets.window.adjustHeight(350);  // do this here in case the pre-auth callback above wasn't called

        var identifiers = jive.tile.getIdentifiers();
        var viewerID = identifiers['viewer'];   // user ID
        // handle the case of a callback with no ticketID passed .. this happens if
        // we verified that the viewer ID already has a valid token without doing the OAuth2 dance ...
        if (ticketID == undefined)    ticketID = viewerID;

        // set up a query to get this user's list of repositories
        var query = encodeURIComponent("/user/repos");
        osapi.http.get({
            'href' : host + '/{{{TILE_NAME_BASE}}}/oauth/query?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID +
                "&query=" + query,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
            var config = onLoadContext['config'];
            if ( response.status >= 400 && response.status <= 599 ) {
                alert("ERROR!" + JSON.stringify(response.content));
            }
            var data = response.content;
            for (var i = 0; i < data.length; i++) {
                var opt;

                if (data[i].full_name == config['organization']) {
                    opt = "<option value=" + data[i].name + " selected>" + data[i].full_name +"</option>";
                } else {
                    opt = "<option value=" + data[i].name + ">" + data[i].full_name +"</option>";
                }
                $("#repoList").append(opt);
            }

            $("#btn_done").click( function() {
                var repo = $("#repoList").val();
                var fullName = $("#repoList option:selected").text();
                var toReturn = {
                    "organization" : fullName,
                    "repository" : repo,
                    "isGitHub" : true
                };

                console.log("toReturn", toReturn);
                if ( ticketID ) {
                    toReturn['ticketID'] = ticketID;
                }
                jive.tile.close(toReturn);
            });
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
        ticketURL: '/{{{TILE_NAME_BASE}}}/oauth/isAuthenticated',
        extraAuthParams: {
            scope:'user,repo'
        }
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    OAuth2ServerFlow( options ).launch();
}
