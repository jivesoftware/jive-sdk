var host, setHost = function( newHost ) {
    host = newHost;
};


(function() {
    jive.tile.onOpen(function(config, options, other, container ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }
        var url = host + "/todoConfig/config";

        var getParams = {
            'href': url,
            'authz': "signed",
            'format': 'json',
            "noCache": true
        }
        osapi.http.get(getParams).execute(function (resp) {
            $("#clientid").val(resp.content.clientid);
        });


        $("#btn_submit").click( function() {

            var params = {
                'href': url,
                'authz': "signed",
                'format': 'json',
                "noCache": true,
                "headers": {"content-type": ["application/json"]},
                "body": {
                    "clientid": $("#clientid").val()
                }
            };
            osapi.http.post(params).execute(function (response) {
                if(response.content) {
                    $("#message").text("Saved...");
                    setTimeout(function() {
                        jive.tile.close(config, {} );
                    }, 1000);
                } else {
                    $("#message").text(response.error && response.error.message);
                }
            });
        });
    });

})();


