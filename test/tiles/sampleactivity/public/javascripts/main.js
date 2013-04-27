(function() {
    jive.tile.onOpen(function(config, options ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        var json = config || {
            "posting": "on"
        };

        // prepopulate the sequence input dialog
        $("input[name=post_activity]").val([json["posting"]]);

        $("#start_sequence").val( json["startSequence"]);

        $("#btn_submit").click( function() {
            var status = $("input[name=post_activity]:checked").val();
            config["posting"] = status;
            jive.tile.close(config, {} );
            gadgets.window.adjustHeight(300);
        });
    });

})();

