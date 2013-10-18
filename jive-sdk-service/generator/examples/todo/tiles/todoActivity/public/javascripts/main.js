(function() {
    jive.tile.onOpen(function(config, options, other, container ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        var json = config || { };
        json.posting = json.posting || "on";
        json.project = json.project || container.name;


        // prepopulate the sequence input dialog
        $("input[name=post_activity]").val([json["posting"]]);
        $("#project").val([json.project]);

        $("#btn_submit").click( function() {
            config.posting = $("input[name=post_activity]:checked").val();
            config.project = $("#project").val();
            jive.tile.close(config, {} );
            gadgets.window.adjustHeight(300);
        });
    });

})();

