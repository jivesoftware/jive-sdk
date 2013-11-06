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

jive.tile.onOpen(initialize);

function initialize(config, options) {
    console.log("config:",config);
    if (!config.color) {
        config = JSON.parse(JSON.parse(config));
    }
    getJobInfo(config.url);

    var people = {};
    var sharedPeople = {};
    var parent;

    jive.tile.getContainer(function(container) {
        parent = container['resources']['self']['ref'];

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

            $("#create-discussion").click(function() {
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
                        "text": '<p>' + $("#message").val() + '</p>' + $("#jobs-panel").html()
                    },
                    "subject": $("#subject").val() || ' Jenkins build report',
                    "visibility": visibility,
                    "users": shares
                };
                if (shares.length == 0) {
                    obj["parent"] = parent;
                }
                osapi.jive.corev3.discussions.create(obj).execute(function(result) {
                    console.log("result:", result);
                });
                $("#message").val('');
                $("#subject").val('');
                $("#people").val('');
                $("#shared-people").fadeOut();
                alertBox('success', "The discussion has been posted.");
            });

            gadgets.window.adjustHeight();
        });
    });

    $("#jobname").html(config.name);
    $("#gotojenkins").click(function() {
        window.parent.open(config.url);
    });

    $("#postdiscussion").click(function() {
        $("#jobs-panel-container").fadeOut(400, function() {
            $("#discussion-panel").slideDown(400, function() {
                gadgets.window.adjustHeight();
            });
        })
    });
}

function getJobInfo(url) {
    function job(response) {
        console.log("response", response);

        var description = response.content.description;
        if ( description ) {
            console.log("job description: ", description);
            $("#description").html(description);
        } else {
            $("#description-container").hide();
        }

        var buildStatus = response.content.healthReport[1].description.split(':')[1];
        if ( buildStatus ) {
            $("#buildstatus").html(buildStatus);
        } else {
            $("#build-container").hide();
        }

        var jobStatus = response.content.healthReport[0].description.split(':')[1];
        if ( jobStatus ) {
            $("#jobstatus").html(jobStatus);
        } else {
            $("#job-container").hide();
        }

        var lastpass = response.content.lastSuccessfulBuild;
        if (lastpass) {
            function build(response) {
                console.log("last passed:", response);
                var elapsed = new Date().getTime() - response.content.timestamp;
                elapsed = Math.floor(elapsed/86400000);
                $("#lastpassed").html(elapsed+" days have elapsed since the last successful build.");
                gadgets.window.adjustHeight();
            }
            getJenkinsInfo(lastpass.url, build);
        }
        gadgets.window.adjustHeight();
    }
    getJenkinsInfo(url, job);
}

function getJenkinsInfo(url, callback) {
    osapi.http.get({
        'href':host + '/proxy?proxiedUrl=' + encodeURIComponent(url),
        'format':'json'
    }).execute(callback);
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