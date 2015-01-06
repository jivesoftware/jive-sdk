jive.tile.onOpen(function(configData, options) {

    // Update field with config data
    $("#config_string").text(configData["configString"]);

    // Update field with private property data
    jive.tile.getPrivateProps ( function(props) {
        $("#private_string").text(props["privateString"]);
    });

    // When action button is clicked...
    $("#action").click( function() {

        // Run action
        jive.tile.doAction( this, {
            "privateString" : $("#private_string").text()
        }).then( function(actionData) {

            // Update private property using updatePrivateProps...
            jive.tile.updatePrivateProps ( {
                "privateString" : actionData["privateString"]
            }, function(returnObject) {
                console.log("Updated private properties: ", returnObject);
                $("#private_string").text(returnObject["privateString"]);
            });

            // Resize window
            gadgets.window.adjustHeight();

        }, function() {
            alert("Canceled action");
        });
    });

    gadgets.window.adjustHeight();

});