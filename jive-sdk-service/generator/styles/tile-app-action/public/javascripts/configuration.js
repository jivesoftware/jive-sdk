(function() {
    jive.tile.onOpen(function(config, options ) {
        gadgets.window.adjustHeight();

        // make sure config has default value
        if (config === null) config = { };
        if (!config["data"]) {
            config["data"] = { };
        }
        if (!config["data"]["configString"]) {
            config["data"]["configString"] = "default data";
        }

        // populate the dialog with existing config value
        $("#config_string").val( config["data"]["configString"]);

        // update config object after clicking submit
        $("#btn_submit").click( function() {
            config["data"]["configString"] = $("#config_string").val();
            jive.tile.close(config, {} );
        });
    });

})();