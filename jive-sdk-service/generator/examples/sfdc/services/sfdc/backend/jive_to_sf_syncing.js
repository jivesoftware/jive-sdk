var jive = require('jive-sdk'),
    opportunities = require('./opportunities'),
    sfdc_helpers = require('./sfdc_helpers'),
    q = require('q');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public

exports.jiveCommentsToSalesforce = function (extstream) {
    return opportunities.getLastTimePulled(extstream, "jivecomment").then(function (lastTimePulled) {
        var opts = {
            "fieldList": ["content", "externalID", "rootExternalID", "published" ], // list of fields to be returned on Jive entity
            "itemsPerPage": 100,              // for paginated requests, the no. of items to return per request
            "commentSourceType": "JIVE",     // Must be "JIVE" or "EXTERNAL" or "ALL". Defaults to "ALL"
            "publishedAfter": lastTimePulled  // Get comments that were created after this time only
        };
        return jive.extstreams.fetchAllCommentsForExtstream(extstream, opts);
    }).then(function (response) {
        var commentsList = response.entity;
        return recursiveProcessComments(commentsList, extstream);
    });
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private

function recursiveProcessComments(commentsList, extstream) {
    var promise = q.resolve(null);

    commentsList.list.forEach(function (comment) {
        promise = promise.then(function (response) {
            return pushCommentToSalesforce(comment, extstream);
        });
    });

    if (!commentsList.next || !commentsList.links.next || commentsList.links.next.indexOf('startIndex') < 0) {
        return promise.thenResolve(commentsList);
    }

    return promise.then(function (response) {
        return commentsList.next().then(function (nextList) {
            return recursiveProcessComments(nextList);
        });
    });
}

function pushCommentToSalesforce(jiveComment, extstream) {
    if (jiveComment.hasOwnProperty('externalID') && jiveComment['externalID'] != null) {
        jive.logger.error('Error! Attempted to push an external comment present in Jive back into salesforce!');
        return null;
    }

    var ticketID = extstream.config.ticketID;
    var sfActivityID = jiveComment['rootExternalID'];
    var text = jiveComment.content.text;
    var uri = '/chatter/feed-items/' + sfActivityID + '/comments?text=' + encodeURIComponent(extractPlainText(text));
    var publishedTime = new Date(jiveComment.published).getTime();

    return sfdc_helpers.postSalesforceV27(ticketID, uri, null).then(function (response) {
        jive.logger.info('Pushed comment to Salesforce');
        return opportunities.updateLastTimePulled(extstream, publishedTime, "jivecomment").then(function () {
            var id = response && response.entity && response.entity.id;
            return id ? opportunities.recordSyncFromJive(extstream, id) : null;
        });
    });
}

function extractPlainText(commentHtml) {
    var i = commentHtml.indexOf("<p>"), j = commentHtml.indexOf("</p>");
    if (i < 0) {
        return commentHtml; //Was plain text type apparently
    }
    return commentHtml.slice(i + "<p>".length, j);
}

