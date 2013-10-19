var opportunities = require('./opportunities'),
    jive_to_sf_syncing = require('./jive_to_sf_syncing'),
    jive = require('jive-sdk'),
    q = require('q');


function pullActivity(instance) {
    return opportunities.pullActivity(instance).then(function (data) {
        var promise = q.resolve(1);
        data.forEach(function (activity) {
            delete activity['sfdcCreatedDate'];
            promise = promise.thenResolve(jive.extstreams.pushActivity(instance, activity));
        });

        promise = promise.catch(function (err) {
            jive.logger.error('Error pushing activity to Jive', err);
        });

        return promise;
    });
}

function pullComments(instance) {

    return opportunities.pullComments(instance).then(function (comments) {
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
}

function pushComments(instance) {
    return jive_to_sf_syncing.jiveCommentsToSalesforce(instance);
}

function pullOpportunity(instance) {
    return opportunities.pullOpportunity(instance);
}


exports.eventHandlers = [
    {
        'event' : 'sfdcPullActivity',
        'handler' : function(context) {
            return pullActivity(context['instance']);
        }
    },

    {
        'event' : 'sfdcPullComments',
        'handler' : function(context) {
            return pullComments(context['instance']);
        }
    },

    {
        'event' :'sfdcPushComments',
        'handler' : function(context) {
            return pushComments(context['instance']);
        }
    },

    {
        'event' :'sfdcPullOpportunity',
        'handler' : function(context) {
            return pullOpportunity(context['instance']);
        }
    }
];
