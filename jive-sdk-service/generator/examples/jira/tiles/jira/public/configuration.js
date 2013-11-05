/*jshint laxcomma:true */

function initialize(config, options, host, jirahost) {
    var user;
    var pass;
    var filter;
    var viewerID = jive.tile.getIdentifiers()['viewer'];

    isAuthenticated(viewerID);

    if (config.filter) {
        $('#filter').val(config.filterName);
    }
    if (config.sort) {
        if (config.sort == "Severity") $('#filter-panel').find('input[name=sort]')[0].checked = true;
        else if (config.sort == "Type") $('#filter-panel').find('input[name=sort]')[1].checked = true;
        else if (config.sort == "Status") $('#filter-panel').find('input[name=sort]')[2].checked = true;
        else $('#filter-panel').find('input[name=sort]')[3].checked = true;
    }

    function isAuthenticated(viewer) {
        var object = {
            'href': host+"/{{{TILE_NAME}}}/auth?viewer="+viewer,
            'headers' : { 'Content-Type' : ['application/json'] },
            'format':'json',
            'noCache': true,
            'authz':'signed'
        };
        osapi.http.get(object).execute(function(response) {
            if (response.content.found) {
                console.log("already authenticated!");
                $("#loading-panel").hide();
                user=response.content.user;
                pass=response.content.pass;
                getFilters();
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

    function authenticate(viewer, inpuser, inppass) {
        var object = {
            'href': host+"/{{{TILE_NAME}}}/auth?viewer="+viewer,
            'headers' : { 'Content-Type' : ['application/json'] },
            'format':'json',
            'noCache': true,
            'authz':'signed',
            'body':{
                'viewer':viewer,
                'user':inpuser,
                'pass':inppass
            }
        };

        osapi.http.post(object).execute(function(response) {
            console.log("response",response);
            $("#loading-panel").hide();
            if (response.content.written) {
                user = response.content.user;
                pass = response.content.pass;
                getFilters();
                $("#filter-panel").fadeIn();
                gadgets.window.adjustHeight();
            }
            else {
                console.log("failed authentication");
                $("#user").val('');
                $("#pass").val('');
                $("#auth-panel").fadeIn();
                gadgets.window.adjustHeight();
            }
        });
    }

    function getFilters() {
        console.log("client url:",host);
        var object = {
            'href': host+"/{{{TILE_NAME}}}/proxy?url=" + jirahost + "/rest/api/latest/filter/favourite&user="+user+"&pass="+pass,
            'format': 'json',
            'noCache': true
        };

        var callback = function(response) {
            var filters = [];
            response = response.content;
            for (var i=0;i<response.length;i++) {
                filters.push(response[i].name);
            }

            $("#filter").typeahead({
                source:filters,
                updater:function(item) {
                    for (var i=0;i<response.length;i++) {
                        if(response[i].name == item) {
                            filter = response[i].id;
                            break;
                        }
                    }
                    return item;
                }
            });
        };

        osapi.http.get(object).execute(callback);
    }

    function getFilterID(filterName, callback) {
        var object = {
            'href': host+"/{{{TILE_NAME}}}/proxy?url=" + jirahost + "/rest/api/latest/filter/favourite&user="+user+"&pass="+pass,
            'format': 'json',
            'noCache': true
        };

        var filterResponseCallback = function(response) {
            response = response.content;
            for (var i=0;i<response.length;i++) {
                if ( response[i].name === filterName ) {
                    callback( response[i].id);
                    return;
                }
            }
            callback();
        };

        osapi.http.get(object).execute(filterResponseCallback);
    }


    gadgets.window.adjustHeight();

    $("#auth-btn").click(function() {
        $("#auth-panel").fadeOut();
        authenticate(viewerID, $("#user").val(), $("#pass").val());
        $("#loading-panel").show();
    });

    $('#submit').click(function() {
        var filterName = $("#filter").val();
        getFilterID(filterName, function(filterID) {
            var newConfig = {
                'filterName' : filterName,
                'filter':filterID,
                'viewer':viewerID,
                'sort':$("#filter-panel").find('input:radio[name="sort"]:checked').val()
            };
            jive.tile.close(newConfig, {});
        });

    });
}
