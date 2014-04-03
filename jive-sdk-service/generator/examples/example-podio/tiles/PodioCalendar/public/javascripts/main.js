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

        // handle the case of a callback with no ticketID passed .. this happens if
        // we verified that the viewer ID already has a valid token without doing the OAuth2 dance ...
        var identifiers = jive.tile.getIdentifiers();
        var viewerID = identifiers['viewer'];   // user ID
        if (ticketID == undefined)    ticketID = viewerID;

        var config = onLoadContext['config'];
        if (typeof config === 'string')
        {
            config = JSON.parse(config) ;
        }

        // check that we actually validated for the current user ...
        if (config['ticketID'] != undefined && config['ticketID'] != viewerID)
        {
            // alert("oops!")
            // we have  a problem ... we validated a ticket ID that didn't match the viewerID, so
            // we need to reauthorize using the viewerID ...
            delete config['ticketID'] ;
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
                }
            };

            OAuth2ServerFlow( options ).launch();

            return;
        }

        // success on authentication .. now get the project info for this user ...
        osapi.http.get({
            'href' : host + '/{{{TILE_NAME_BASE}}}/oauth/getProjectInfo?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
                var config = onLoadContext['config'] ;
                if (typeof config === 'string')
                {
                    config = JSON.parse(config) ;
                }

                if (response.status == 403)
                {
                    // not authenticated .... need to show a different screen and bail ...
                    $("#j-card-authentication-failed").show();
                    gadgets.window.adjustHeight();

                    $("#btn_exit").click( function() {
                        jive.tile.close();
                    });
                }
                else
                {
                    if ( response.status >= 400 && response.status <= 599 ) {
                        alert("ERROR!" + JSON.stringify(response.content));
                    }

                    //debugger;
                    var data = response.content.items;          // get to array of projects

                    for (var i=0; i<response.content.total; i++)
                    {
                        var opt;

                        // assumes that project name comes first .. can improve on this ....
                        // build up a lis for the drop down that has the item (project) id and name as part of it ...
                        if (data[i].title == config['project'])
                            opt = "<option value=" + data[i].item_id + " selected>" + data[i].title+"</option>";
                        else
                            opt = "<option value=" + data[i].item_id + ">" + data[i].title+"</option>";
                        //alert(opt)  ;
                        $("#projectList").append(opt);
                    }

                    // add in an entry for just the user stream
                    var opt =  "<option value=0";
                    if (config['projectID'] == 0) opt += " selected";
                    opt += ">non-project User Centric Calendar</option>";
                    $("#projectList").append(opt);

                    $("#j-card-configuration").show();
                    gadgets.window.adjustHeight();

                    $("#btn_done").click( function() {
                        var projectName = $("#projectList option:selected").text();
                        var projectID =  $("#projectList option:selected").val();
                        var index = $("#projectList").prop("selectedIndex");

                        //debugger;
                        var toReturn = {
                            "project" : projectName,
                            "projectID" : projectID,
                            "isPodio" : true

                        };
                        console.log("toreturn", toReturn);
                        if ( ticketID ) {
                            toReturn['ticketID'] = ticketID;
                        }

                        jive.tile.close(toReturn );
                    });
                }
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
        }
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    //debugger;
    OAuth2ServerFlow( options ).launch();
}