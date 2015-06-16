jive.tile.onOpen(function(data, options) {

    if ( typeof data !== 'object' ) {
        data = JSON.parse(JSON.parse(data || {} ));
    }

    // update HTML with data pushed from service
    $("#data").text(data["pushData"]);
    $("#count").text(data["pushCount"]);

    gadgets.window.adjustHeight();
});
