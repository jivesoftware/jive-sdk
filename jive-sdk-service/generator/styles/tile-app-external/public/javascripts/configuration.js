(function() {
    jive.tile.onOpen(function(config, options ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        var json = config || {
            "pushData": "Not initialized"
        };

        // populate the input dialog with config data
        $("#config_val").val( json["pushData"]);

        $("#btn_submit").click( function() {

            // update config data from input dialog
            config["pushData"] = $("#config_val").val();

            // send config to service
            jive.tile.close(config, {} );

            gadgets.window.adjustHeight(300);
        });
    });

})();

