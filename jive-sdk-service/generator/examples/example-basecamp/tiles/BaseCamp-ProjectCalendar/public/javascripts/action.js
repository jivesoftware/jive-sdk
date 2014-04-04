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

    $("#btn_upload").click( function() {
        //debugger;

        var title = $("#title").val();
        if (title.length == 0)
        {
            alert( "Document must have a title!")  ;
            return;
        }
        var content = $("#content").val();
        if (content.length == 0)
        {
            // really need to trim up comment and such before doing all of this, but this is first pass!
            alert( "Document must have non-empty content!")  ;
            return;
        }
        // alert( "post comment '" + comment + "'"  );

        //debugger;
        //var timestamp = new Date().toLocaleString()       ;
        var document = {"title" : title, "content" : content};
        var bodyPayload = JSON.stringify(document);

        //debugger;

        var config = onLoadContext['config'];

        if (typeof config === 'string')
        {
            config = JSON.parse(config) ;
        }

        var query = encodeURIComponent("/projects/"+config.id+"/documents.json");
        var url = host + '/{{{TILE_NAME}}}/oauth/post?' +
                "ts=" + new Date().getTime() +
                "&ticketID=" + qTicketID +
                "&accountID=" + config.accountID +
                "&query=" + query;

        debugger;
        osapi.http.post({
            'href' : url,
            headers : { 'Content-Type' : ['application/json'] },
            //'format' : 'json',
            'noCache': true,
            'authz': 'signed',
            'body' : bodyPayload
        }).execute(function( response ) {
                debugger;
                //alert( "status=" + response.status) ;
                if ( response.status >= 400 && response.status <= 599 ) {
                    alert("ERROR (comment post)!" + JSON.stringify(response.content));
                }
                else
                {
                    //alert("GOOD (comment) post!" + JSON.stringify(response.content, null, 2));
                    $("#title").val("");       // clear out the comment ...
                    $("#content").val("");       // clear out the comment ...

                    alertBox('success', "The document has been posted.");
                }

            });


    } );   // end btn_comment

    function alertBox(type, message) {
        if(!type) {
            type = 'success';
        }

        var alertBox = $(".alert-area").removeClass().addClass('alert-' + type).text(message).fadeIn();
        gadgets.window.adjustHeight();

        setTimeout(function(){
            alertBox.fadeOut();
            alertBox.removeClass().addClass('alert-area');
            jive.tile.close({"message": "The document has been posted."});
        }, 2000);
    }
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

        $("#descriptionB").text(config.description);
        $("#basecampLinkB").attr( "href", config.url)  ;
        $("#basecampLinkB").text(config.name)
        $("#eventDescriptionB").text(config.eventDescription);
        $("#eventTitleB").text(config.eventTitle);
        $("#eventDateTimeB").text(config.start);

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