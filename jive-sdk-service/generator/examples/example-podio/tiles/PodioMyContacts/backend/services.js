var jive = require("jive-sdk");
var oauth = require('./routes/oauth/sampleOauth');

var refreshToken = "";
var doRefreshToken = false;

function doDataPush(instance) {

    var ticketID = instance['config']['ticketID'];

    var tokenStore = jive.service.persistence();
    tokenStore.find('tokens', {'ticket': ticketID }).then(function (found) {
        if (found) {
            var accessToken = found[0]['accessToken']['access_token'];
            refreshToken = found[0]['accessToken']['refresh_token'];

            jive.util.buildRequest(
                    "https://api.podio.com/contact/?contact_type=user&exclude_self=true&order=name&type=mini&oauth_token=" + accessToken,
                    'GET'
                ).then(
                // success
                function (response) {
                    var contacts = response['entity'];
                    if (contacts) {
                        var dataContacts = [];

                        if (contacts['forEach']) {
                            contacts.forEach(function (entry) {

                                var name = entry['name'];
                                var emails = entry['mail'];
                                var email;
                                if (emails && emails['forEach'] && emails.length > 0) {
                                    email = emails[0];
                                }

                                var at = name.indexOf('@');

                                var dataContactEntry = {
                                    "name": name.substring(0, at > -1 ? at: 14),
                                    "value": email ? email : "--"
                                };

                                if ( dataContacts.length < 10 )
                                dataContacts.push(dataContactEntry);
                            });
                        }
                    }

                    var dataToPush = {
                        data: {
                            "title": "My contacts",
                            "contents": dataContacts
                        }
                    };

                    jive.tiles.pushData(instance, dataToPush).then(function (e) {
                        console.log('* podioContacts success*');
                    }, function (e) {
                        console.log('* podioContacts err*');
                    });

                    //console.log(contacts);
                },

                // fail
                function (response) {
                    console.log("Failed to query!");
                    if (response.statusCode == 401)
                    {
                        // do a token refresh next time around ...
                        doRefreshToken = true;
                    }
                }
            );
        }
    });
}
function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);
    if (doRefreshToken && refreshToken.length)     {
        console.log( 'refreshing token in podio ...')
        oauth.refreshToken( refreshToken, instance['config']['ticketID'] );
        doRefreshToken = false;
    }
    else
        doDataPush(instance);
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( 'podio' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    60 * 1000
);

exports.eventHandlers = [

    {
        'event': 'newInstance',
        'handler' : function(theInstance){
            jive.logger.info("Caught newInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                processTileInstance(theInstance);
            }
        }
    },

    {
        'event': 'updateInstance',
        'handler' : function(theInstance){
            jive.logger.info("Caught updateInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                processTileInstance(theInstance);
            }
        }
    }
];
