
(function() {
    jive.tile.onOpen(function(config, options ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        var json = config || {
            "organization" : "" ,
            "repository" : ""
        };

        // prepopulate the sequence input dialog
        $("#organization").val( json["organization"]);
        $("#repository").val( json["repository"]);

        $("#btn_submit").click( function() {
            config["organization"] = $("#organization").val();
            config["repository"] = $("#repository").val();
            jive.tile.close(config, {} );
            gadgets.window.adjustHeight(300);
        });
    });

})();

