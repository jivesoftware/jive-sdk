(function() {
    var clientid;

    jive.tile.onOpen(function(config, options, other, container ) {
        osapi.jive.corev3.systemExtProps.get({}).execute(function (resp) {
            if( resp && resp.content ) {
                clientid = resp.content.clientid;
            }
        });
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        var json = config || { };

        json.project = json.project || (container && container.name) || "";

        // prepopulate the sequence input dialog
        $("#project").val( json.project);

        $("#btn_submit").click( function() {
            config.project = $("#project").val();
            config.clientid = clientid;
            jive.tile.close(config, {} );
            gadgets.window.adjustHeight(300);
        });

    });

})();

