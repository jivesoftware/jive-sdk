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

/**
 * Library for manipulating external stream instances.
 */

var q = require('q');
var util = require('util');
var instances = require('./instances');
var pusher = require('./dataPusher');
var jive = require('../api');
var jiveClient = require('./client');

var extstreams = Object.create(instances);
module.exports = extstreams;

extstreams.getCollection = function() {
    return "extstreamInstance";
};

extstreams.pushActivity = function ( tileInstance, activity) {
    var deferred = q.defer();

    pusher.pushActivity(tileInstance, activity, function(result ){
        deferred.resolve(result);
    }, function(e) {
        deferred.reject( e );
    });

    return deferred.promise;
};

var pushComment = function ( tileInstance, comment, commentURL) {
    var deferred = q.defer();

    pusher.pushComment(tileInstance, commentURL, comment, function(result) {
        deferred.resolve( result );
    }, function(e) {
        deferred.reject( e );
    });

    return deferred.promise;
};

extstreams.commentOnActivity = function(activity, comment ) {
    if (!(activity && activity.resources && activity.resources.comments && activity.resources.comments.ref)
        || !activity.parent) {
        throw new Error('Error in jive.extstreams.commentOnActivity: input activity is not a valid Jive object. It is missing the resources.comments.ref field or parent field.');
    }
    var commentsURL = activity.resources.comments.ref;
    var parentInstanceURL = activity.parent + '/activities';

    return extstreams.findByURL(parentInstanceURL).then(function(extstream) {
        if (!comment.externalID){
            comment.externalID = extstream.name + '_' + 'comment' + '_' + String(new Date().getTime());
            jive.logger.warn(util.format('No externalID field given when creating new comment. Assigning ID %s', comment.externalID ));
        }
        return pushComment(extstream, comment, commentsURL);
    });

}

extstreams.fetchCommentsOnActivity = function(activity, optionalFieldList, optionalItemsPerPage) {
    if (!(activity && activity.resources && activity.resources.comments && activity.resources.comments.ref)
        || !activity.parent) {
        throw new Error('Error in jive.extstreams.fetchCommentsOnActivity: input activity is not a valid Jive object. It is missing the resources.comments.ref field or parent field.');
    }

    var commentsURL = activity.resources.comments.ref;
    if (optionalFieldList || optionalItemsPerPage) {
        commentsURL += '?';

        var q = false;
        if (optionalFieldList) {
            commentsURL +=  'fields=' + optionalFieldList.join(',');
            q = true;
        }
        if (optionalItemsPerPage) {
            commentsURL += (q ? '&' : '') + 'count=' + optionalItemsPerPage;
            q = true;
        }
    }
    var parentInstanceURL = activity.parent + '/activities';

    return extstreams.findByURL(parentInstanceURL).then(function(extstream) {
        return jiveClient.getWithTileInstanceAuth(extstream, commentsURL);
    });

}
