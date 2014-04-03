function addCheckbox(name) {
    var container = $('#myDiv');
    var inputs = container.find('input');
    var id = inputs.length+1;

    //debugger;
    $('<input />', { type: 'checkbox', id: 'cb'+id, value: name }).appendTo(container);
    $('<span>&nbsp;&nbsp;&nbsp</span>', {}).appendTo(container) ;
    $('<label />', { 'for': 'cb'+id, text: name }).appendTo(container);
    $('<br>', {}).appendTo(container);
}
function initialize(config, options, host) {

    var identifiers = jive.tile.getIdentifiers();
    var viewerID = identifiers['viewer'];

    isAuthenticated(viewerID);

    function isAuthenticated(viewer) {
        var object = {
            'href': host+"/{{{TILE_NAME}}}/auth?viewer="+viewer,
            'headers' : { 'Content-Type' : ['application/json'] },
            'format':'json',
            'noCache': true,
            'authz':'signed'
        }
        osapi.http.get(object).execute(function(response) {
            //debugger;
            console.log("response",response);
            if (response.content.found) {
                console.log("already authenticated!");
                $("#loading-panel").hide();
                getApplications();
                $("#filter-panel").fadeIn();
                gadgets.window.adjustHeight();
            }
            else {
                console.log("need to authenticate");
                $("#loading-panel").hide();
                $("#auth-panel").fadeIn();
                gadgets.window.adjustHeight();
            }
        });
    }

    function authenticate(viewer) {
        var object = {
            'href': host+"/{{{TILE_NAME}}}/auth?viewer="+viewer,
            'headers' : { 'Content-Type' : ['application/json'] },
            'format':'json',
            'noCache': true,
            'authz':'signed',
            'body':{
                'viewer':viewer,
            }
        }
        osapi.http.post(object).execute(function(response) {
            console.log("response",response);
            $("#loading-panel").hide();
            if (response.content.written) {
                getApplications();
                $("#filter-panel").fadeIn();
                gadgets.window.adjustHeight();
            }
            else {
                console.log("failed authentication");
                $("#auth-panel").fadeIn();
                gadgets.window.adjustHeight();
            }
        });
    }

    function getApplications() {
        console.log("client url:",host);
        //debugger;
        var object = {
            'href': host+"/{{{TILE_NAME}}}/proxy?getApps",
            'format': 'json',
            'noCache': true
        };

        var callback = function(response) {
            if (response.status >= 400 && resonse.statuc <= 599) {
                alert( "ERROR! " + JSON.stringify(response.content)) ;
            }
            else
            {

                //console.log("response:",response.content);
                //debugger;
                var applications = [];

                response = response.content;
                //alert("GOOD! " + JSON.stringify(response)) ;
                //debugger;
                for (var i=0;i<response.length;i++) {
                    applications.push( {name : response[i].name, appID : response[i].id});
                    //debugger;
                    /*
                    $('#filter-panel').append(
                        $(document.createElement('input')).attr({
                            id : 'cb' + (i+1) ,
                            name : response[i].name[0] ,
                            value : response[i].name[0] ,
                            type : 'checkbox'
                        })
                    )
                    */

                   addCheckbox(response[i].name[0]) ;
                }
                gadgets.window.adjustHeight();
                //console.log("applications:", applications);
                //alert("GOOD (" + applications.length + ") ! " + JSON.stringify(applications)) ;
            }
        };

        osapi.http.get(object).execute(callback);
    }

    gadgets.window.adjustHeight();

    $("#auth-btn").click(function() {
        $("#auth-panel").fadeOut();
        authenticate(viewerID);
        $("#loading-panel").show();
    });

    $('#submit').click(function() {
        var newConfig = {
            'viewer':viewerID,
        };
        jive.tile.close(newConfig, {});
    });
};
//jive.tile.onOpen(initialize)