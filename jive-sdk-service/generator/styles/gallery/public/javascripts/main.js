(function() {
    jive.tile.onOpen(function(config, options ) {
        gadgets.window.adjustHeight();

        if ( typeof config === "string" ) {
            config = JSON.parse(config);
        }

        $("#btn_submit").click( function() {
            jive.tile.close(config, {} );
            gadgets.window.adjustHeight(300);
        });
    });

})();

