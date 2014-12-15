jive.tile.onOpen(function(data, options) {

    if ( typeof data !== 'object' ) {
        data = JSON.parse(JSON.parse(data || {} ));
    }

    gadgets.window.adjustHeight();
});
