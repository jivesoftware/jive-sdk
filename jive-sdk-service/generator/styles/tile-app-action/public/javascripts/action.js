jive.tile.onOpen(function(data, options) {

    // Update field with private property data
    jive.tile.getPrivateProps ( function(props) {
        $("#private_string").val(data["privateString"]);
    });

    // Click the add button
    $("#add").click( function() {

        // Return the new values
        var returnData = {
            "privateString" : $("#private_string").val(),
        };
        jive.tile.close( returnData );
    });

    // Click the cancel button
    $("#cancel").click( function() {
        jive.tile.close();
    });

    gadgets.window.adjustHeight();
});