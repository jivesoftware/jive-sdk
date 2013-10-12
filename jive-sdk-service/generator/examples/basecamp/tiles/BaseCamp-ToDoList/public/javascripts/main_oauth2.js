
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

function populateToDoLists( host, ticketID, accountID, projectID)
{
    // get the data ...
    var query="/projects/" + projectID + "/todolists.json";

    $("#todoList").empty(); // Clear existing entries ...

    osapi.http.get({
        'href' : host + '/{{{TILE_NAME}}}/oauth/query?' +
            "&ts=" + new Date().getTime() +
            "&ticketID=" + ticketID +
            "&query=" + query + "&accountID=" + accountID,
        headers : { 'Content-Type' : ['application/json'] },
        //'format' : 'json',
        'noCache': true,
        'authz': 'signed'
    }).execute(function( response ) {
            //debugger;
            //alert( "status=" + response.status) ;
            if ( response.status >= 400 && response.status <= 599 ) {
                alert("ERROR (get to do list)!" + JSON.stringify(response.content));
            }
            else
            {
                var items=[];
                //debugger;
                //alert("GOOD (get to do list) post!" + JSON.stringify(response.content, null, 2));
                var body = response.content;
                var json = JSON.parse(body);

                if (json && json.length)
                {
                    for (i = 0; i < json.length; i++)
                    {
                        var opt;

                         opt = "<option value=" + json[i]['id'] + ">" + json[i]['name']  +"</option>";

                        $("#todoList").append(opt);

                    }
                }
            }
     });
}
function doIt( host ) {

    var accountID;
    var g_ticketID;

    //alert( "DOIT: host=" + host);
    var oauth2SuccessCallback = function(ticketID) {
        //alert( "Success! ticketID="+ticketID );
        // do configuration
        $("#j-card-authentication").hide();
        $("#j-card-configuration").show();
        gadgets.window.adjustHeight(350);  // do this here in case the pre-auth callback above wasn't called

        //debugger;
        var identifiers = jive.tile.getIdentifiers();
        var viewerID = identifiers['viewer'];   // user ID
        // handle the case of a callback with no ticketID passed .. this happens if
        // we verified that the viewer ID already has a valid token without doing the OAuth2 dance ...
        var config = onLoadContext['config'];
        if (typeof config === 'string')
        {
            config = JSON.parse(config) ;
        }
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
                authorizeUrl : host + '/{{{TILE_NAME}}}/oauth/authorizeUrl',
                ticketURL: '/oauth/isAuthenticated',
                extraAuthParams: {
                    type: 'web_server'
                }
            };

            OAuth2ServerFlow( options ).launch();

            return;
        }

        if (ticketID == undefined)    ticketID = viewerID;

        g_ticketID = ticketID;
        // set up a query to get this user's list of projects
        //debugger;
        osapi.http.get({
            'href' : host + '/oauth/getAuthorizationInfo?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID,
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
                   //alert("GOOD!" + JSON.stringify(response.content, null, 2));

                //debugger;

                var data = response.content;
                //debugger;
                //console.log(data);

                // extract account ID from project URL ..
                var idx1 = data[0].url.indexOf("basecamp.com") ;
                var idx2 = data[0].url.indexOf("/api") ;

                idx1 +=   13;   // position to start of account ID
                var accountID = data[0].url.slice(idx1, idx2);
                // could use a forEach or something here ...
                for (i = 0; i < data.length; i++)
                {
                    var opt;

                    if (data[i].name == config['project'])
                        opt = "<option value=" + data[i].id + " selected>" + data[i].name +"</option>";
                    else
                        opt = "<option value=" + data[i].id + ">" + data[i].name +"</option>";
                    //alert(opt)  ;
                    $("#projectList").append(opt);

                }
                populateToDoLists( host, ticketID, accountID, $("#projectList option:selected").val()) ;

                //debugger
                $("#projectList").change( function () {
                    var projectID = $(this).attr('value');
                    debugger;
                    populateToDoLists( host, g_ticketID, accountID, projectID) ;
                    //alert('Value change to ' + $(this).attr('value'));
                })
                $("#btn_done").click( function() {
                    //debugger;
                    var projectName = $("#projectList option:selected").text();
                    var projectID =  $("#projectList option:selected").val();
                    var todoListID =   $("#todoList option:selected").val();
                    var todoListDescription = $("#todoList option:selected").text();

                    var index = $("#projectList").prop("selectedIndex");
                    var url = data[index].url;
                    var description = data[index].description;


                    //debugger;
                    var toReturn = {
                        "accountID"   : accountID,
                        "projectID"  : projectID,
                        "project" : projectName,
                        "todoListID" : todoListID,
                        "id" : projectID ,
                        "url"  : url,
                        "description" : description,
                        "todoListDescription" : todoListDescription,
                        "isBasecamp" : true
                    };


                    if ( ticketID ) {
                        toReturn['ticketID'] = ticketID;
                    }
                    console.log("toReturn", toReturn);
                    //alert(util.inspect(toReturn))  ;
                    jive.tile.close(toReturn );

                });
            });

        gadgets.window.adjustHeight();
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
            type: 'web_server'
        }
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });


    OAuth2ServerFlow( options ).launch();
}