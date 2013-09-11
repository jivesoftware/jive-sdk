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

var count = 0;

var jive = require("jive-sdk");
var q = require('q');
var sampleOauth = require("./routes/oauth/sampleOauth") ;
var activities = require('./activities' );
var jive_to_podio_syncing = require('./jive_to_podio_syncing') ;

//var lastTime=0;
exports.task = new jive.tasks.build(
    // runnable
    function () {
        jive.extstreams.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
            //var now = new Date();

    //console.log( "+ Podio Activity Stream task ...." + now.getTime() + " elapse=" + (now.getTime() - lastTime) ) ;
    //        lastTime = now.getTime();

            if ( instances ) {
            //if (0)  {
                instances.forEach( function( instance ) {

                    var config = instance['config'];
                    if ( config && config['posting'] === 'off' ) {
                        return;
                    }

                    activities.pullActivity(instance).then( function(data) {
                        var promise = q.resolve(1);
                        data.forEach(function (activity) {
                            delete activity['podioCreatedDate'];
                            console.log( "{{{TILE_NAME}}} push: ", JSON.stringify(activity));
                            promise = promise.thenResolve(jive.extstreams.pushActivity(instance, activity));
                        });

                        promise = promise.catch(function(err) {
                            jive.logger.error('Error pushing activity to Jive', err);
                        });

                        return promise;
                    }).then( function() {

                        activities.pullComments(instance).then( function(comments) {
                            //console.log("got " + comments.length + " comment activity record(s) from Podio") ;
                            var promise = q.resolve(1);
                            comments.forEach(function (comment) {
                                delete comment['podioCreatedDate'];
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
                    }).then ( function() {
                        jive_to_podio_syncing.jiveCommentsToPodio(instance).then( function(data) {
                            console.log( "got " + data.length + " comment record(s) from Jive");
                            if (data.length > 0)
                                console.log( "got one! (or more") ;
                            console.log( data );
                        });
                    });
                });
            }
        });
    }

    // interval, 5000 = 5 secs
, 10000 );
