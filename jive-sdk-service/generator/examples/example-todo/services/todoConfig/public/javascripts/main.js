var host, url, setHost = function( newHost ) {
    host = newHost;
    url = host + "/todoConfig/config";
};


(function() {
    jive.tile.onOpen(function(config, options, other, container ) {

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }
        var url = host + "/{{{TILE_PREFIX}}}todoConfig/config";

        var getParams = {
            'href': url,
            'authz': "signed",
            'format': 'json',
            "noCache": true
        };

        osapi.http.get(getParams).execute(function (resp) {
            $("#clientid").val(resp.content.clientid);
            $("#licenseKey").text(resp.content.licenseKey);
            $("#licenseKeyField").val(resp.content.licenseKey);

            gadgets.window.adjustHeight(300);
        });


        $("#btn_submit").click( function() {

            var params = {
                'href': url,
                'authz': "signed",
                'format': 'json',
                "noCache": true,
                "headers": {"content-type": ["application/json"]},
                "body": {
                    "clientid": $("#clientid").val(),
                    "licenseKeyField": $("#licenseKeyField").val()
                }
            };
            osapi.http.post(params).execute(function (response) {
                if(response.content) {
                    if ( response.status !== 200 ) {
                        $("#message").text(response.content.reason);
                    } else {
                        $("#message").text("Saved...");
                        setTimeout(function() {
                            jive.tile.close(config, {} );
                        }, 1000);
                    }
                } else {
                    $("#message").text(response.error && response.error.message);
                }
            });
        });
    });

})();


