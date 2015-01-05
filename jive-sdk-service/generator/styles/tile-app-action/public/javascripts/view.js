jive.tile.onOpen(function(configData, options) {

    // Update field with config data
    $("#config_string").text(configData["configString"]);

    // Update field with public property data
    jive.tile.getExtendedProps ( function(props) {
        $("#public_string").text(props["myDataKey"]);
    });

    // Update field with private property data
    jive.tile.getPrivateProps ( function(props) {
        $("#private_string").text(props["myDataKey"]);
    });

    // When action button is clicked...
    $("#action").click( function() {

        // Run action
        jive.tile.doAction( this, {
            "publicString" : $("#public_string").text(),
            "privateString" : $("#private_string").text()
        }).then( function(actionData) {

            // Update public property using updateExtendedProps...
            jive.tile.updateExtendedProps ( {
                "myDataKey" : actionData["publicString"]
            }, function(returnObject) {
                console.log("Updated extended properties: ", returnObject);
                $("#public_string").text(returnObject["myDataKey"]);
            });

            // Update private property using updatePrivateProps...
            jive.tile.updatePrivateProps ( {
                "myDataKey" : actionData["privateString"]
            }, function(returnObject) {
                console.log("Updated private properties: ", returnObject);
                $("#private_string").text(returnObject["myDataKey"]);
            });

            // Resize window
            gadgets.window.adjustHeight();

        }, function() {
            alert("Canceled action");
        });
    });

    gadgets.window.adjustHeight();

});