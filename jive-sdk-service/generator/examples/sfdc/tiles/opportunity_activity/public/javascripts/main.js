
var ticketErrorCallback = function() {
    alert('ticketErrorCallback error');
};

var jiveAuthorizeUrlErrorCallback = function(err) {
    $(".j-card").hide();
    $("#j-error").text(JSON.stringify(err, null, 4));
    $("#j-card-authurl-error").show();
    gadgets.window.adjustHeight();
};

var preOauth2DanceCallback = function() {
    $(".j-card").hide();
    $("#j-card-authentication").show();
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
        $(".j-card").hide();
        $("#j-card-loading").show();
        gadgets.window.adjustHeight(200);

        if ( !ticketID ) {
            $(".j-card").hide();
            $("#j-card-rejected .j-error").text("Unauthorized");
            $("#j-card-rejected").show();
            gadgets.window.adjustHeight();

            $(".btn-cancel").click( function() {
                jive.tile.close({});
            });

            return;
        }

        var query = encodeURIComponent("SELECT Id, Name, Description, StageName, Amount FROM Opportunity");

        osapi.http.get({
            'href' : host + '/{{{TILE_NAME_BASE}}}/oauth/query?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID +
                "&query=" + query,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
                if ( response.error ) {
                    $(".j-card").hide();
                    $("#j-error").text(JSON.stringify(response.error, null, 4));
                    $("#j-card-rejected").show();
                    gadgets.window.adjustHeight();
                    return;
                }

                $(".j-card").hide();
                $("#j-card-configuration").show();

                var config = onLoadContext['config'];
                var data = response.content;

                $.each( data.records, function() {
                    var record = $(this)[0];
                    var id = record["Id"];
                    var name = record["Name"];
                    var option = $("<option value=" + id + ">" + name + "</option>");
                    $("#select_opportunity").append(option);
                });

                if ( config["opportunityID"] ) {
                    // set previously selected
                    $("#select_opportunity").val( config["opportunityID"] );
                }
                console.log(data);

                $("#btn_done").click( function() {

                    var selected = $("#select_opportunity").val();
                    var toReturn = {
                        "opportunityID" : selected,
                        "isSFDC" : true
                    };
                    console.log("toreturn", toReturn);
                    if ( ticketID ) {
                        toReturn['ticketID'] = ticketID;
                    }

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
        authorizeUrl : host + '/{{{TILE_NAME_BASE}}}/oauth/authorizeUrl'
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    $(".btn-cancel").click( function() {
        jive.tile.close({});
    });

    OAuth2ServerFlow( options ).launch();
}
