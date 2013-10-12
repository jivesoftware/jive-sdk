
var jive = require("jive-sdk");

function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id );

    var count = new Date().getTime();

    var dataToPush = {
        "activity":
        {
            "action":{
                "name":"posted",
                "description":"Activity " + count
            },
            "actor":{
                "name":"Actor Name",
                "email":"actor@email.com"
            },
            "object":{
                "type":"website",
                "url":"http://www.google.com",
                "image":"http://placehold.it/102x102",
                "title":"Activity " + count,
                "description":"Activity " + count
            },
            "jive" : {
                "app" : {
                    "appUUID" : "42e91771-bc0e-49a2-aeca-bbba9ac31eeb",
                    "view" : "canvas",
                    "context" : {
                        "randomValue": count
                    }
                }
            },
            "externalID": '' + count
        }
    };

    jive.extstreams.pushActivity(instance, dataToPush).then( function()  {
        console.log("pushed activity");

//        jive.extstreams.setExternalProps( instance, {
//            "foo":"bar"
//        }).then( function (p) {
//            console.log(p);
//        });
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        return jive.extstreams.findByDefinitionName( 'webhooks' ).then( function(instances) {
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
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(theInstance){
            var webhookCallback = jive.service.serviceURL() + '/webhooks';
            var jiveCommunity = theInstance['jiveCommunity'];

            var ticketID = theInstance['config']['ticketID'];

            function doWebhook(accessToken) {
                jive.webhooks.register(
                        jiveCommunity, undefined, theInstance['config']['parent'],
                        webhookCallback, accessToken
                    ).then(function (webhook) {
                        webhook['tileInstanceID'] = theInstance['id'];

                        var webhookEntity = webhook['entity'];
                        var webhookToSave = {
                            'object': webhookEntity['object'],
                            'events': webhookEntity['event'],
                            'callback': webhookEntity['callback'],
                            'url': webhookEntity['resources']['self']['ref'],
                            'id': webhookEntity['id'],
                            'tileInstanceID': theInstance['id']
                        };

                        jive.webhooks.save(webhookToSave);
                    });
            }
            jive.community.find( { 'jiveCommunity' : jiveCommunity }, true).then( function(community) {

                if ( community && community['oauth'] && community['oauth']['access_token'] ) {
                    doWebhook( community['oauth']['access_token']);
                } else {
                    jive.service.persistence().find('tokens', {'ticket': ticketID }).then(function (found) {
                        var accessToken = found ? found[0]['accessToken']['access_token'] : undefined;
                        doWebhook( accessToken );
                    });
                }


            });

        }
    }

];
