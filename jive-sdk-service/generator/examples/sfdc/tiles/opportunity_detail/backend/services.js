var opportunities = require('./opportunities');
var jive = require('jive-sdk');
var sampleOauth = require('./routes/oauth/sampleOauth');

function processTileInstance(instance) {
    opportunities.pullOpportunity(instance).then(function (data) {
        jive.tiles.pushData(instance, data);
    }).catch(function (err) {
        jive.logger.error('Error pushing salesforce data to Jive', err);
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    10000
);

exports.eventHandlers = [
    {
        'event' : jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : processTileInstance
    },

    {
        'event' : jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : processTileInstance
    }
];

exports.onBootstrap = function(app) {
    var oauthConfig = sampleOauth.fetchOAuth2Conf();
    if ( oauthConfig['oauth2ConsumerKey'] === "!!!_CHANGE_ME_DO_NOT_START_SERVER_WITH_OUT_A_REAL_ONE_FROM_SFDC!!!" ) {
        jive.logger.error("You do not have a validate SFDC oauth consumer key configured. " +
            "Please check your configuration file (jiveclientconfiguration.json).");
        process.exit();
    }

    if ( oauthConfig['oauth2ConsumerSecret'] === "!!!_CHANGE_ME_DO_NOT_START_SERVER_WITH_OUT_A_REAL_ONE_FROM_SFDC!!!" ) {
        jive.logger.error("You do not have a validate SFDC oauth consumer secret configured. " +
            "Please check your configuration file (jiveclientconfiguration.json).");
        process.exit();
    }

    var clientOAuth2CallbackUrl = oauthConfig['clientOAuth2CallbackUrl'];
    jive.logger.info("** IMPORTANT **");
    jive.logger.info("Please make sure you set the oAuth2 callback URL in Salesforce to be: " + clientOAuth2CallbackUrl);
};
