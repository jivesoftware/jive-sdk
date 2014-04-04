/*
 * Copyright 2013 Jive Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//jive.tile.onOpen(initialize);

function initialize(config, options, host) {
    //debugger;
    var json;
    if (typeof config === 'string')
    {
        config = JSON.parse(config) ;
        if (typeof config === 'string')
         config = JSON.parse(config)       ;
    }
    console.log("config:", config);
    console.log("options:", options);
    console.log("host:", host);
    //debugger;

    var parent;
    jive.tile.getContainer(function(container) {
        parent = container['resources']['self']['ref'];
    });

    $("#newrelicview").click(function() {
        window.parent.open("https://rpm.newrelic.com/accounts/"+config.acctID+"/applications/"+config.appID);
    });

    //debugger
    var appName = config.appName;

    $('#appName').text( appName) ;
    //var desc;

    var items = [];
        items.push('<thead><tr><th>Response Time</th><th>Throughput</th><th>Error Rate</th><th>APDEX</th></thead>');
        items.push('<tr"><td bgcolor="#00FF00">'+config.rt+
                   '</td><td bgcolor="#FF0000">'+config.tp+
                   '</td><td bgcolor="gold">'+config.er+
                   '</td><td style="color: #0000FF"> ' +config.apdex +
                   '</td></tr>');
    var colors = ["grey", "green", "gold", "red"];
    $('#metrics').append('<thead><tr><th>Response Time</th><th>Throughput</th><th>Error Rate</th><th>APDEX</th></thead>');
    $('#metrics').append('<tr><td style="color: ' + colors[config.rt_thres] + '">'+config.rt+
         '</td><td style="color: ' + colors[config.tp_thres] + '">'+config.tp+
         '</td><td style="color: ' + colors[config.er_thres] + '">'+config.er+
         '</td><td style="color: ' + colors[config.apdex_thres] + '">'+config.apdex+
         '</td></tr>');
    //$("#issue-table .table").append(items.join(''));
   // $("#issue-table").show();

    //desc = "RT=" + config.rt + " TP=" + config.tp +
    //       " Error %=" + config.er  + " Apdex="   + config.apdex ;
    //$('#description').text(desc)  ;

    var people = {};
    var sharedPeople = {};

    osapi.jive.corev3.people.get().execute(function(result) {
        function alerts(item) {
            var itemtag = item.replace(/ /g,"-");
            sharedPeople[item] = true;
            if($("#alert-"+itemtag).length) {
                console.log("already in list:", itemtag);
                return;
            }
            $("#shared-people").append('<div class="alert" id="alert-' + itemtag + '"><button type="button" class="close" data-dismiss="alert">x</button>' + item + '</div>');
            $("#alert-" + itemtag).bind('close', function () {
                sharedPeople[item] = false;
                gadgets.window.adjustHeight();
            });
            gadgets.window.adjustHeight();
        }

        result = result.list;
        $("#people").typeahead({
            source:function(query, process) {
                var names = [];
                for (var i in result) {
                    people[result[i].displayName] = result[i];
                    names.push(result[i].displayName);
                }
                process(names);
            },
            items:3,
            updater:function(item) {
                alerts(item);
                $("#people").val('');
                return item;
            }
        });
        gadgets.window.adjustHeight();
    });

    $("#btn_done").click( function() {
        jive.tile.close(null, {} );
    });

    $("#create-discussion").click(function() {
        var table = '<table border="1"">' + $("#metrics").html() + "</table>";
        var message = $("#message").val();
        var shares = [];
        for (var p in people) {
            if (sharedPeople[p]) {
                shares.push(people[p]);
            }
        }
        var visibility = (shares.length > 0) ? "people":"place";
        var obj = {
            "content": {
                "type": "text/html",
                "text": '<p>'+message+'</p><br>'+table
            },
            "subject": $("#subject").val(),
            "visibility": visibility,
            "users":shares
        }
        if (shares.length == 0) {
            obj["parent"] = parent;
        }
        osapi.jive.corev3.discussions.create(obj).execute(function(result) {
            //debugger;
            console.log("result:", result);
        });
        $("#message").val('');
        $("#subject").val('');
        $("#people").val('');
        $("#shared-people").fadeOut();
        alertBox('success', "The discussion has been posted.");
    });

    window.setTimeout( function() {
        gadgets.window.adjustHeight();
    }, 1000);

    gadgets.window.adjustHeight();

// }, 1000);
}

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