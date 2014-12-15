jive.tile.onOpen(function(config, options) {

    if ( typeof config !== 'object' ) {
        config = JSON.parse(JSON.parse(config || {} ));
    }

    gadgets.window.adjustHeight();
});