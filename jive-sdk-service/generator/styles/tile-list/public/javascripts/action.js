/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

jive.tile.onOpen(function(config, options) {

    config = JSON.parse(JSON.parse(config));
    console.log("config:", config);
    console.log("options:", options);

    var parent;
    jive.tile.getContainer(function(container) {
        parent = container.resources.self.ref;
    });



    $("#create-discussion").click(function() {

        var message = $("#message").val();

        var obj = {
            "content": {
                "type": "text/html",
                "text": '<p>'+message+'</p><p>Current count is <b>'+config.count + '</b></p>'
            },
            "subject": $("#subject").val(),
            "visibility": "place",
            "parent": parent

        }

        osapi.jive.corev3.discussions.create(obj).execute(function(result) {
            console.log("result:", result);
        });
        $("#message").val('');
        $("#subject").val('');
        alertBox('success', "The discussion has been posted.");
        setTimeout(function() {
            jive.tile.close(config, {} );
        }, 1000);
    });

    window.setTimeout( function() {
         gadgets.window.adjustHeight();
     }, 1000);

    gadgets.window.adjustHeight();

//    }, 1000);
});

function alertBox(type, message) {
    if(!type) {
        type = 'success';
    }

    var alertBox = $(".alert-area").removeClass().addClass('alert-' + type).text(message).fadeIn();
    gadgets.window.adjustHeight();

    setTimeout(function(){
        alertBox.fadeOut();
        alertBox.removeClass().addClass('alert-area');
        jive.tile.close({"message": "The discussion has been created."});
    }, 2000);
}