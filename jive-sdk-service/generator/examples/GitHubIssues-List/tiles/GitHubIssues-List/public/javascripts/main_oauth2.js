
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

    //alert( "DOIT: host=" + host);
    var oauth2SuccessCallback = function(ticketID) {
        // alert( "Success! ticketID="+ticketID );
        // do configuration
        $("#j-card-authentication").hide();
        $("#j-card-configuration").show();
        gadgets.window.adjustHeight(350);  // do this here in case the pre-auth callback above wasn't called

        //debugger;
        var identifiers = jive.tile.getIdentifiers();
        var viewerID = identifiers['viewer'];   // user ID
        // handle the case of a callback with no ticketID passed .. this happens if
        // we verified that the viewer ID already has a valid token without doing the OAuth2 dance ...
        if (ticketID == undefined)    ticketID = viewerID;

        // set up a query to get this user's list of repositories
        var query = encodeURIComponent("/user/repos");
        //alert( "href=" + host + '/GitHubIssues-List/oauth/query?') ;
        //debugger;
        osapi.http.get({
            'href' : host + '/{{{TILE_NAME}}}/oauth/query?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID +
                "&query=" + query,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
                //debugger;

                var config = onLoadContext['config'];

                //alert( "status=" + response.status) ;
                if ( response.status >= 400 && response.status <= 599 ) {
                    alert("ERROR!" + JSON.stringify(response.content));
                }
                //else
                 //   alert("GOOD!" + JSON.stringify(response.content, null, 2));

                //debugger;
                var data = response.content;

                console.log(data);
                //var theData = {
                 //   'organization' : 'JiveSoftware' ,
                 //   'repository' : 'Jive-SDK'
                //};
                //$("#the_data").text(JSON.stringify(response.content));
                //$("#organization").val("<undef>") ;
                //$("#repository").val("repo") ;

                // could use a forEach or something here ...
                for (i = 0; i < data.length; i++)
                {
                    var opt;

                    if (data[i].full_name == config['organization'])
                        opt = "<option value=" + data[i].name + " selected>" + data[i].full_name +"</option>";
                    else
                        opt = "<option value=" + data[i].name + ">" + data[i].full_name +"</option>";
                    //alert(opt)  ;
                    $("#repoList").append(opt);

                }

                $("#btn_done").click( function() {
                    //debugger;
                    var repo = $("#repoList").val();    // this returns the 'value'
                    var fullName = $("#repoList option:selected").text()
                    var toReturn = {
                        "organization" : fullName,
                        "repository" : repo,
                        "isGitHub" : true
                    };

                    console.log("toReturn", toReturn);
                    if ( ticketID ) {
                        toReturn['ticketID'] = ticketID;
                    }
                    // alert(util.inspect(toReturn))  ;
                    jive.tile.close(toReturn );

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
        authorizeUrl : host + '/{{{TILE_NAME}}}/oauth/authorizeUrl',
        ticketURL: '/oauth/isAuthenticated',
        extraAuthParams: {
            scope:'user,repo'
        }
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    OAuth2ServerFlow( options ).launch();
}
