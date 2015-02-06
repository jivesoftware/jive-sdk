gadgets.util.registerOnLoadHandler(function() {
    // add code that should run on page load here

    osapi.jive.corev3.people.getViewer().execute( function(viewer) {
        var viewerID = viewer.displayName;
        $("#viewer").html(viewerID);
    });

    $("#j-fun-button").click( function() {
        var message = $("#j-message").val() || "Pop me!";
        osapi.jive.core.container.sendNotification( {'message':message, 'severity' : 'success'} );
    });

    // resize app window to fit content
    gadgets.window.adjustHeight();
    gadgets.window.adjustWidth();
});
