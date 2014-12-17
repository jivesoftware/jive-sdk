jive.tile.onOpen(function(data, options) {

    console.log('Incoming tile app data is: ' +JSON.stringify(data));

    if ( typeof data !== 'object' ) {
        data = JSON.parse(JSON.parse(data || {} ));
    }

    // update HTML with data pushed from service
    $("#data").text(data["pushData"]);
    $("#count").text(data["pushCount"]);

    gadgets.window.adjustHeight();
});
