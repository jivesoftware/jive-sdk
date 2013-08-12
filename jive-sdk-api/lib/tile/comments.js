/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var jive = require('../../api');
var q = require('q');

exports.commentOnActivity = function(activity, comment) {
    if (!(activity && activity.resources && activity.resources.comments && activity.resources.comments.ref)
        || !activity.parent) {

        return q.reject({ 'err' : 'Error in jive.extstreams.commentOnActivity: input activity is not a valid Jive object.' +
            'It is missing the resources.comments.ref field or parent field.'} );
    }
    var commentsURL = activity.resources.comments.ref;
    var parentInstanceURL = activity.parent + '/activities';

    return jive.extstreams.findByURL(parentInstanceURL).then(function(extstream) {
        if (!comment.externalID){
            comment.externalID = extstream.name + '_' + 'comment' + '_' + String(new Date().getTime());
            jive.logger.warn(jive.util.format('No externalID field given when creating new comment. Assigning ID %s', comment.externalID ));
        }

        // schedule the comment push
        return jive.context.scheduler.schedule(jive.constants.tileEventNames.PUSH_COMMENT_TO_JIVE, {
            'tileInstance' : extstream,
            'comment' : comment,
            'commentsURL' : commentsURL
        } );
    });
};

exports.commentOnActivityByExternalID = function(extstream, externalActivityID, comment) {
    var dataURL = extstream['url'];
    var commentsURL = dataURL.replace(/activities$/, 'extactivities/') + externalActivityID + '/comments';
    if (!comment.externalID){
        comment.externalID = extstream.name + '_' + 'comment' + '_' + String(new Date().getTime());
        jive.logger.warn(jive.util.format('No externalID field given when creating new comment. Assigning ID %s', comment.externalID ));
    }

    // schedule the comment push
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.PUSH_COMMENT_TO_JIVE, {
        'tileInstance' : extstream,
        'comment' : comment,
        'commentsURL' : commentsURL
    } );
};

exports.fetchCommentsOnActivity = function(activity, opts) {
    if (!(activity && activity.resources && activity.resources.comments && activity.resources.comments.ref)
        || !activity.parent) {

        return q.reject({ 'err' : 'Error in jive.extstreams.fetchCommentsOnActivity: ' +
            'input activity is not a valid Jive object. It is missing the resources.comments.ref field or parent field.'} );
    }

    var commentsURL = activity.resources.comments.ref;
    commentsURL += buildQueryString(opts['fieldList'], opts['itemsPerPage'], opts['commentSourceType']);
    var parentInstanceURL = activity.parent + '/activities';

    return jive.extstreams.findByURL(parentInstanceURL).then( function(extstream) {
        return jive.context.scheduler.schedule(jive.constants.tileEventNames.GET_PAGINATED_RESULTS, {
            'extstream' : extstream,
            'commentsURL' : commentsURL
        } );
    }).then(function(response){
        if (response.entity && response.entity.list) {
            response.entity.list = filterComments(response.entity.list, opts['commentSourceType'], opts['publishedAfter']);
        }
        return response;
    });
};

exports.fetchAllCommentsForExtstream = function(extstream, opts) {

    var dataURL = extstream['url'];
    var commentsURL = commentsUrlFromDataUrl(dataURL);

    commentsURL += buildQueryString(opts['fieldList'], opts['itemsPerPage'], opts['commentSourceType']);

    var promise = jive.context.scheduler.schedule(jive.constants.tileEventNames.GET_PAGINATED_RESULTS, {
        'extstream' : extstream,
        'commentsURL' : commentsURL
    } );

    return promise.getPaginated(extstream, commentsURL).then(function(response) {

        if (response.entity && response.entity.list) {
            response.entity.list = filterComments(response.entity.list, opts['commentSourceType'], opts['publishedAfter']);
        }
        return response;
    });

};

function buildQueryString(optionalFieldList, optionalItemsPerPage, commentSourceType) {
    var queryStr = '';
    if (optionalFieldList || optionalItemsPerPage || (commentSourceType && commentSourceType.toUpperCase() === 'JIVE')) {
        queryStr += '?';

        var q = false;
        if (optionalFieldList) {
            if (optionalFieldList.indexOf('externalID') < 0) { //Must return the externalID to be able to filter properly by comment source
                optionalFieldList.push('externalID');
            }
            if (optionalFieldList.indexOf('published') < 0) { //Need publish date for filtering
                optionalFieldList.push('published');
            }
            queryStr +=  'fields=' + encodeURIComponent(optionalFieldList.join(','));
            q = true;
        }
        if (optionalItemsPerPage) {
            queryStr += (q ? '&' : '') + 'count=' + optionalItemsPerPage;
            q = true;
        }
        if (commentSourceType && commentSourceType.toUpperCase() === 'JIVE') {
            queryStr += (q ? '&' : '') + 'filter=omitExternal'; //For efficiency add filter that omits external comments
            q = true;
        }
    }

    return queryStr;

}

//Sort of a hack to build the comments URL, because we are not storing the "resources" JSON from a Jive external stream object currently
function commentsUrlFromDataUrl(dataURL) {
    return dataURL.slice(0, dataURL.indexOf('activities')) + 'comments';
}

//Helper to filter comments based on whether the externalID field is present
function filterComments(list, commentSourceType, publishedAfter) {
    if (commentSourceType && commentSourceType.toUpperCase() != 'ALL') {

        if (commentSourceType.toUpperCase() == 'JIVE') {
            list = list.filter(function(comment) {
                return comment.externalID == undefined;
            }) ;
        }
        else if (commentSourceType.toUpperCase() == 'EXTERNAL') {
            list = list.filter(function(comment) {
                return comment.externalID != undefined;
            }) ;
        }
    }

    if (publishedAfter) {
        list = list.filter(function(comment) {
            var published = new Date(comment['published']);
            if (isNaN(published.getTime())) {
                return true;
            }
            return published.getTime() > publishedAfter;
        });
    }

    return list;
}