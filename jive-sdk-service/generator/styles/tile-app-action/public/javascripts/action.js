jive.tile.onOpen(function(data, options) {

    // Update field with public property data
    jive.tile.getExtendedProps ( function(props) {
        $("#public_string").val(data["publicString"]);
    });

    // Update field with private property data
    jive.tile.getPrivateProps ( function(props) {
        $("#private_string").val(data["privateString"]);
    });

    // Click the add button
    $("#add").click( function() {

        // Return the new values
        var returnData = {
            "publicString" : $("#public_string").val(),
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