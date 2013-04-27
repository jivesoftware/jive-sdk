
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

        var query = encodeURIComponent("SELECT Id, Name, Description, StageName, Amount FROM Opportunity");

        osapi.http.get({
            'href' : host + '/samplesfdc/oauth/query?' +
                'id=' + ticketID +
                "&ts=" + new Date().getTime() +
                "&ticketID=" + ticketID +
                "&query=" + query,
            'format' : 'json',
            'authz': 'signed'
        }).execute(function( response ) {
                debugger;

                var config = onLoadContext['config'];

                if ( response.status >= 400 && response.status <= 599 ) {
                    alert("ERROR!", JSON.stringify(response.content));
                }

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
        authorizeUrl : host + '/samplesfdc/oauth/authorizeUrl'
    };

    $("#btn_done").click( function() {
        console.log(onLoadContext);
    });

    OAuth2ServerFlow( options ).launch();
}
