gadgets.util.registerOnLoadHandler(function () {

    var actionSelection,
        selectedContent;

    // seed outgoing
    var outgoing = {
        display: {
            "type": "image",
            "previewImage":"http://apphosting.jivesoftware.com/apps/dev/rtejsondropper/images/dropper-128x128.png",
            "label":"JAF Delux Productions"
        },
        target: {
            "type": "embed",
            "view":"embedded.json",
            "context":{
                "id":"EDIT_ME_ID",
                "lastUpdated":"2012-Jan-23"
            }
        }
    };

    var loadContent = function (selection) {
        console.log("==== loadContent ====");
        console.log("selection:", selection);
        actionSelection = selection;

        // setup incoming selection
        $('#incoming_selection').val(JSON.stringify(selection, null, 2));

        // seed outgoing
        $("#outgoing_selection").val(JSON.stringify(outgoing, null, 2));
    };

    // register update actions event, that will execute when the app loads (selection context)
    gadgets.actions.updateAction({
        id:"com.jivesoftware.rte.dropper.json",
        callback:loadContent
    });
    gadgets.actions.updateAction({
        id:"com.jivesoftware.rte.dropper.html",
        callback:loadContent
    });
    gadgets.actions.updateAction({
        id:"com.jivesoftware.rte.dropper.actionMenu",
        callback:loadContent
    });
    gadgets.actions.updateAction({
        id:"com.jivesoftware.rte.dropper.actionMenu.places",
        callback:loadContent
    });

    // register a listener for embedded experience context (embedded context)
    opensocial.data.getDataContext().registerListener('org.opensocial.ee.context', function (key) {
        var data = opensocial.data.getDataContext().getDataSet(key);

        console.log("==== registerListener ====");
        console.log("embedded context:", data);

        // setup incoming embedded context
        $('#incoming_embedded_context').val(JSON.stringify(data, null, 2));

        // seed outgoing
        $("#outgoing_selection").val(JSON.stringify(outgoing, null, 2));
    });


    $("#btn_close_and_send").click(
        function () {
            var outgoing = $("#outgoing_selection").val();
            var outgoingJson = JSON.parse(outgoing);
            osapi.jive.core.container.closeApp({data:outgoingJson});
        }
    );

    $("#btn_close_and_send_programmatic").click(
        function () {
            var outgoing = $("#outgoing_selection").val();
            var outgoingJson = JSON.parse(outgoing);
            osapi.jive.core.container.artifacts.create(outgoingJson, 'com.jivesoftware.rte.dropper.json', function (markupResponse) {
                var artifactMarkup = markupResponse.markup, error = markupResponse.error;

                var html = "<div><b>Programmatic</b></div><div>" + artifactMarkup + "</div>";
                osapi.jive.core.container.editor().insert( html );

            }, false, true );

        }
    );

    $("#btn_close_and_send_html").click(
        function () {
            var outgoing = $("#outgoing_html").val();
            osapi.jive.core.container.editor().insert( outgoing );
        }
    );

    $("#btn_close_and_send_document").click(
        function() {
            //This must be a V3 ID, not a V2 ID. V2 IDs are the number the append the DOC-, e.g. DOC-1234  
            var docId = $("#doc_id").val();

            osapi.jive.corev3.contents.get({id: docId}).execute(function(response) {
                if (response.error) {
                    alert("Error " + response.error.code + " retrieving document id " + docId + ". Error message was: "
                        + response.error.message);
                } else {
                    console.log("Retrieved documents");
                    console.log(response);

                    var html = response.content.text;
                    osapi.jive.core.container.editor().insert( html );
                }
            });


        }
    );

});



