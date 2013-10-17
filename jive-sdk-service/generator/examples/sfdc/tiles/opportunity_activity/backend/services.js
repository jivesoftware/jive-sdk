var opportunities = require('./opportunities'),
    jive_to_sf_syncing = require('./jive_to_sf_syncing'),
    jive = require('jive-sdk'),
    q = require('q');
var sampleOauth = require('./routes/oauth/sampleOauth');

function processTileInstance(instance) {

    //
    // 1. pull activity from SFDC and push to Jive
    //
    opportunities.pullActivity(instance).then(function (data) {
        var promise = q.resolve(1);
        data.forEach(function (activity) {
            delete activity['sfdcCreatedDate'];
            promise = promise.thenResolve(jive.extstreams.pushActivity(instance, activity));
        });

        promise = promise.catch(function (err) {
            jive.logger.error('Error pushing activity to Jive', err);
        });

        return promise;

    //
    // 2. pull comments from SFDC and push to Jive
    //
    }).then(function () {
        opportunities.pullComments(instance).then(function (comments) {
            var promise = q.resolve(1);
            comments.forEach(function (comment) {
                delete comment['sfdcCreatedDate'];
                var externalActivityID = comment['externalActivityID'];
                delete comment['externalActivityID'];

                promise = promise.thenResolve(jive.extstreams.commentOnActivityByExternalID(instance,
                    externalActivityID, comment));
            });

            promise = promise.catch(function (err) {
                jive.logger.error('Error pushing comments to Jive', err);
            });

            return promise;
        });

    //
    // 3. pull comments from Jive and push to SFDC
    //
    }).then(function () {
        return jive_to_sf_syncing.jiveCommentsToSalesforce(instance);
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function () {
        jive.extstreams.findByDefinitionName('{{{TILE_NAME}}}').then(function (instances) {
            if (instances) {
                instances.forEach(function (instance) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    10000
);

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