var jive = require('jive-sdk'),
    activities = require('./activities'),
    sampleOauth = require('./routes/oauth/sampleOauth'),
    q = require('q');

var querier = require('./query');

exports.jiveCommentsToPodio = jiveCommentsToPodio;

function jiveCommentsToPodio(extstream) {
    return activities.getLastTimePulled(extstream, "jivecomment").then(function (lastTimePulled) {
        var opts = {
            "fieldList": ["content", "externalID", "rootExternalID", "published" ], // list of fields to be returned on Jive entity
            "itemsPerPage": 100,              // for paginated requests, the no. of items to return per request
            "commentSourceType": "JIVE",      // Must be "JIVE" or "EXTERNAL" or "ALL". Defaults to "ALL"
            "publishedAfter": lastTimePulled  // Get comments that were created after this time only
        };
        return jive.extstreams.fetchAllCommentsForExtstream(extstream, opts);
    }).then(function (response) {
        var commentsList = response.entity;
        return recursiveProcessComments(commentsList, extstream);
    });
}

function recursiveProcessComments(commentsList, extstream) {

    var promise = q.resolve(null);

    commentsList.list.forEach(function (comment) {
        promise = promise.then(function (response) {
            return pushCommentsToPodio(comment, extstream);
        });
    });


    if (!commentsList.next || !commentsList.links.next || commentsList.links.next.indexOf('startIndex') < 0) {
        return promise.thenResolve(commentsList);
    }

    return promise.then(function (response) {
        return commentsList.next().then(function (nextList) {
            return recursiveProcessComments(nextList, extstream);
        });
    });

}

function pushCommentsToPodio(jiveComment, extstream) {

    if (jiveComment.hasOwnProperty('externalID') && jiveComment['externalID'] != null) {
        jive.logger.error('Error! Attempted to push an external comment present in Jive back into Podio!');
        return null;
    }

    var bcActivityID = jiveComment['rootExternalID'];
    var parts = bcActivityID.split('-');

    var text = jiveComment.content.text;
    var query ="/comment/"+ parts[0] +"/" + parts[1] + '/';
    var document = {
        "value" : extractPlainText(text),
        "external_id" : 'jive-' + jiveComment['id']
    };
    var bodyPayload = JSON.stringify(document);

    var publishedTime = new Date(jiveComment.published).getTime();

    return querier.doPost(query, bodyPayload, extstream).then(function (response) {
        console.log('Pushed comment to Basecamp');
        return activities.updateLastTimePulled(extstream, publishedTime, "jivecomment").then(function () {
            var id = response && response.entity && response.entity.id;
            if (id) {
                return activities.recordSyncFromJive(extstream, id);
            }
            return null;
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