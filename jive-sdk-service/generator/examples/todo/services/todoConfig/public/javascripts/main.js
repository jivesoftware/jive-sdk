(function() {


    jive.tile.onOpen(function(config, options, other, container ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        osapi.jive.corev3.systemExtProps.get({}).execute(function (resp) {
            if( resp && resp.content ) {
                $("#clientid").val(resp.content.clientid);
            }
        });

        $("#btn_submit").click( function() {
            osapi.jive.corev3.systemExtProps.create({
                "clientid": $("#clientid").val()
            }).execute(function (resp) {
                    jive.tile.close(config, {} );
                    gadgets.window.adjustHeight(300);
            });
        });

    });

})();

