var opportunities = require('./opportunities'),
    jive_to_sf_syncing = require('./jive_to_sf_syncing'),
    jive = require('jive-sdk'),
    q = require('q');

exports.task = new jive.tasks.build(
    // runnable
    function () {
        jive.extstreams.findByDefinitionName('{{{TILE_NAME}}}').then(function (instances) {
            if (instances) {
                instances.forEach(function (instance) {

                    opportunities.pullActivity(instance).then(function (data) {
                        var promise = q.resolve(1);
                        data.forEach(function (activity) {
                            delete activity['sfdcCreatedDate'];
                            promise = promise.thenResolve(jive.extstreams.pushActivity(instance, activity));
                        });

                        promise = promise.catch(function(err) {
                            jive.logger.error('Error pushing activity to Jive', err);
                        });

                        return promise;

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

                                promise = promise.catch(function(err) {
                                    jive.logger.error('Error pushing comments to Jive', err);
                                });

                                return promise;
                            });

                        }).then(function() {
                            return jive_to_sf_syncing.jiveCommentsToSalesforce(instance);
                        });


                });
            }
        });
    },

    // interval (optional)
    10000
);

