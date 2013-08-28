var jive = require('jive-sdk'),
    activities = require('./activities'),
    sampleOauth = require('./routes/oauth/sampleOauth'),
    bc_helpers = require( "./routes/oauth/basecamp_helpers"),
    q = require('q');

exports.jiveCommentsToBasecamp = jiveCommentsToBasecamp;

function jiveCommentsToBasecamp(extstream) {
    return activities.getLastTimePulled(extstream, "jivecomment").then(function (lastTimePulled) {
        var opts = {
            "fieldList": ["content", "externalID", "rootExternalID", "published" ], // list of fields to be returned on Jive entity
            "itemsPerPage": 100,              // for paginated requests, the no. of items to return per request
            "commentSourceType": "JIVE",     // Must be "JIVE" or "EXTERNAL" or "ALL". Defaults to "ALL"
            "publishedAfter": lastTimePulled  // Get comments that were created after this time only
        };
        return jive.extstreams.fetchAllCommentsForExtstream(extstream, opts);
    }).then(function (response) {
            var allCommentsProcessed = false;
            var commentsList = response.entity;
            return recursiveProcessComments(commentsList, extstream);

            /*
            var cleanList=[];

            commentsList.list.forEach(function(comment) {
               cleanList.push(
                   { comment : extractPlainText(comment.content.text),
                     externalID : comment.externalID,
                     rootExternalID : comment.rootExternalID
                   } );
            });
            return cleanList;
            */
        });
}
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

};

function pushCommentToSalesforce(jiveComment, extstream) {

    if (jiveComment.hasOwnProperty('externalID') && jiveComment['externalID'] != null) {
        jive.logger.error('Error! Attempted to push an external comment present in Jive back into Basecamp!');
        return null;
    }

    var ticketID = extstream.config.ticketID;
    var accountID = extstream.config.accountID;
    var projectID = extstream.config.id;

    var bcActivityID = jiveComment['rootExternalID'];
    var text = jiveComment.content.text;
    var query ="/projects/"+projectID+"/todos/" + bcActivityID + "/comments.json";
    var document = { "content" : extractPlainText(text)};
    var bodyPayload = JSON.stringify(document);

    var publishedTime = new Date(jiveComment.published).getTime();

    //return null;

    return bc_helpers.postBasecampV1(accountID, ticketID, sampleOauth, query, bodyPayload).then(function (response) {
        console.log('Pushed comment to Basecamp');
        return activities.updateLastTimePulled(extstream, publishedTime, "jivecomment").then(function () {
            var id = response && response.entity && response.entity.id;
            if (id) {
                return activities.recordSyncFromJive(extstream, id);
            }
            return null;
        });
    });

     /*
    return sfdc_helpers.postSalesforceV27(ticketID, sampleOauth, uri, null).then(function (response) {
        console.log('Pushed comment to Salesforce');
        return opportunities.updateLastTimePulled(extstream, publishedTime, "jivecomment").then(function () {
            var id = response && response.entity && response.entity.id;
            if (id) {
                return opportunities.recordSyncFromJive(extstream, id);
            }
            return null;
        });
    });
    */
}

function extractPlainText(commentHtml) {
    var i = commentHtml.indexOf("<p>"), j = commentHtml.indexOf("</p>");
    if (i < 0) {
        return commentHtml; //Was plain text type apparently
    }
    return commentHtml.slice(i + "<p>".length, j);
}