(function() {
    jive.tile.onOpen(function(config, options, other, container ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        var json = config || { };

        json.project = json.project || container.name;

        // prepopulate the sequence input dialog
        $("#project").val( json["project"]);

        $("#btn_submit").click( function() {
            config["project"] = $("#project").val();
            jive.tile.close(config, {} );
            gadgets.window.adjustHeight(300);
        });

    });

})();

