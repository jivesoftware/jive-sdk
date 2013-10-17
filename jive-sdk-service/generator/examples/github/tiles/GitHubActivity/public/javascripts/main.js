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

function createGithubWebhook(href, bodyPayload, toReturn) {
    osapi.http.post({
        'href': href,
        'authz': 'signed',
        headers: { 'Content-Type': ['application/json'] },
        'noCache': true,
        'body': bodyPayload
    }).execute(function (response) {
        if (response.status >= 400 && response.status <= 599) {
            alert("ERROR ON HOOK CREATE!" + JSON.stringify(response.content));
        } else {
            console.log("OK HOOK CREATE! " + JSON.stringify(response.content));
        }

        jive.tile.close(toReturn, {});
    });
}

function setupGithubWebhook(fullName, host, ticketID, json, toReturn) {
    // set up a query to get the hook information for this repository
    // early version - organization is the full name of the repository ...
    var query = encodeURIComponent("/repos/" + fullName + "/hooks");
    var href = host + '/{{{TILE_NAME_BASE}}}/oauth/query?' +
        'id=' + "all" +
        "&ts=" + new Date().getTime() +
        "&ticketID=" + ticketID +
        "&query=" + query;

    osapi.http.get({
        'href': href,
        'format': 'json',
        'authz': 'signed'
    }).execute(function (response) {
        if (response.status >= 400 && response.status <= 599) {
            alert("ERROR!" + JSON.stringify(response.content));
        } else {
            json = response.content[0];
            console.log("GOOD! id=" + (json == undefined ? '<undef>' : ( json['id'] + " events: " + json['events'])));
            // early dev .. assuming the hook is only created here ..
            // so if it doesn't exist, create iot ...

            if (json == undefined || json['id'] == undefined) {
                var query = encodeURIComponent("/repos/" + fullName + "/hooks");
                var href = host + '/{{{TILE_NAME_BASE}}}/oauth/post?' +
                    'id=' + "all" +
                    "&ts=" + new Date().getTime() +
                    "&ticketID=" + ticketID +
                    "&query=" + query;
                var bodyPayload = {
                    name: "web",
                    active: true,
                    events: [ "push", "issues", "issue_comment" ],
                    config: { "url": host + "/gitHubHook", "content_type": "json"}
                };

                createGithubWebhook(href, bodyPayload, toReturn);
            } else {
                jive.tile.close(toReturn, {});
            }
        }
    });

    return json;
}

function doIt( host ) {
    var oauth2SuccessCallback = function(ticketID) {
        // do configuration
        $("#j-card-authentication").hide();
        $("#j-card-configuration").show();
        gadgets.window.adjustHeight(350);  // do this here in case the pre-auth callback above wasn't called

        var identifiers = jive.tile.getIdentifiers();
        var viewerID = identifiers['viewer'];   // user ID
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
            if ( typeof config === "string" ) {
                config = JSON.parse(config);
            }

            var json = config || {
                "posting": "on"
            };

            // prepopulate the sequence input dialog
            $("input[name=post_activity]").val([json["posting"]]);

            if ( response.status >= 400 && response.status <= 599 ) {
                alert("ERROR!" + JSON.stringify(response.content));
            }

            var data = response.content;
            for (var i = 0; i < data.length; i++) {
                var opt;
                if (data[i].full_name == config['organization']) {
                    opt = "<option value=" + data[i].name + " selected>" + data[i].full_name +"</option>"     ;
                } else {
                    opt = "<option value=" + data[i].name + ">" + data[i].full_name +"</option>"     ;
                }
                $("#repoList").append(opt);
            }

            $("#btn_submit").click( function() {
                var status = $("input[name=post_activity]:checked").val();
                var repo = $("#repoList").val();    // this returns the 'value'
                var fullName = $("#repoList option:selected").text();
                var toReturn = {
                    "organization" : fullName,
                    "repository" : repo,
                    "isGitHub" : true,
                    "posting"  : status

                    };

                console.log("toReturn", toReturn);
                if ( ticketID ) {
                    toReturn['ticketID'] = ticketID;
                }

                // now we need to set up the hook ....
                json = setupGithubWebhook(fullName, host, ticketID, json, toReturn);

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