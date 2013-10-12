var jive = require('jive-sdk');

exports.onBootstrap = function(app) {
    // create a metawebhook when a jive instance registers
    jive.events.addLocalEventListener( 'registeredJiveInstanceSuccess', function( community ) {
        console.log("registering webhook for", community);
        jive.webhooks.register(
            community['jiveCommunity'],
            'webhook',
            undefined,
            jive.service.serviceURL() + '/webhooks'
        );
    } );

};

