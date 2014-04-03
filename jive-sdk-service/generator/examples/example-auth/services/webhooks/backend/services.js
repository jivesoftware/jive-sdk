var jive = require('jive-sdk');

exports.onBootstrap = function(app) {

    // create a metawebhook when a jive instance registers
    jive.events.addLocalEventListener( 'registeredJiveInstanceSuccess', function( community ) {
        jive.webhooks.register(
            community['jiveCommunity'],
            'user_account,user_session,user_membership,webhook,social_group',
            undefined,
            jive.service.serviceURL() + '/webhooks'
        );
    });

};