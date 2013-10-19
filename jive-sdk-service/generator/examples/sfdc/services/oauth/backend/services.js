var jive = require('jive-sdk');
var sampleOauth = require('./routes/oauth/sampleOauth');

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
