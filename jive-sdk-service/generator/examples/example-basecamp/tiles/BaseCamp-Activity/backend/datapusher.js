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
var basecamp_Helpers = require( "./routes/oauth/basecamp_helpers");
var sampleOauth = require("./routes/oauth/sampleOauth") ;
var activities = require('./activities' );
var jive_to_bc_syncing = require('./jive_to_bc_syncing') ;

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.extstreams.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {

        if ( instances ) {
            instances.forEach( function( instance ) {

                var config = instance['config'];
                if ( config && config['posting'] === 'off' ) {
                    return;
                }
                if (1)
                {
                    // area to play around with comment syncing ...
                    activities.pullActivity(instance).then( function(data) {
                        //console.log("got " + data.length + " non-comment activity record(s) from Basecamp") ;
                        var promise = q.resolve(1);
                        data.forEach(function (activity) {
                            delete activity['bcCreatedDate'];
                            console.log( "BaseCampActivity push: ", JSON.stringify(activity));
                            promise = promise.thenResolve(jive.extstreams.pushActivity(instance, activity));
                        });

                        promise = promise.catch(function(err) {
                            jive.logger.error('Error pushing activity to Jive', err);
                        });

                        return promise;
                    }).then( function() {
                        activities.pullComments(instance).then( function(comments) {
                            //console.log("got " + comments.length + " comment activity record(s) from Basecamp") ;
                            var promise = q.resolve(1);
                            comments.forEach(function (comment) {
                                delete comment['bcCreatedDate'];
                                var externalActivityID = comment['externalActivityID'];
                                delete comment['externalActivityID'];

                                promise = promise.thenResolve(jive.extstreams.commentOnActivityByExternalID(instance,
                                    externalActivityID, comment));

                            });

                            promise = promise.catch(function(err) {
                                jive.logger.error('Error pushing comments to Jive', err);
                            });

                            return promise;
                        }).then ( function() {
                            jive_to_bc_syncing.jiveCommentsToBasecamp(instance).then( function(data) {
                                //console.log( "got " + data.length + " comment record(s) from Jive");
                                //if (data.length > 0)
                                //    console.log( "got one! (or more") ;
                                //console.log( data );
                            });
                        });
                    });
                }
                else
                {
                    // original code ....


                    if (config.since == undefined)
                    {
                        var date = new Date();
                        var formatTime = date.toISOString();   // returns Zulu time (UTC)

                        // need to adjust time to proper format ...
                        // Actually, Basecamp will take this Zulu time format:  2013-07-30T16:26:53.664Z
                        //formatTime = "2013-07-30T16:26:53.664Z";     // for test ...
                        config['since'] = formatTime;

                    }
                    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id );

                    var query = "/projects/" + config['id']  + "/events.json?since=" + config['since'];

                    basecamp_Helpers.queryBasecampV1( config['accountID'], config['ticketID'], sampleOauth, query).then(
                        function(response){
                            // good return ...
                            var data = response.entity  ;
                            if (!data.length)
                            {

                                return; // nothing to do ....
                            }

                            var fields = Object.keys(data).map( function(field) {

                                if (field == 0)
                                {
                                    // first one is the latest, use this for our next 'since' time ...
                                    config['since'] =   data[field]['updated_at'] ;
                                }

                                var url =  data[field]['html_url'];
                                url = url.replace("basecamp.com", "www.basecamp.com") ;
                                var summary =  data[field]['summary'];
                                summary = summary.replace("<span>", " ");
                                summary = summary.replace("</span>", " ");
                                return {
                                    "action":{
                                        "name":"posted",
                                        "description": config['project'] + " Activity"
                                    },
                                    "actor":{
                                        "name":data[field]['creator']['name'],
                                        "email":""
                                    },
                                    "object":{
                                        "type":"website",
                                        "url": url,
                                        "image":"http://37signals.com/svn/images/basecamp-logo-for-fluid.png",
                                        "title": summary + " @ '" +config['project'] +"'",
                                        "description":data[field]['excerpt']
                                    },
                                    "externalID": '' + data[field].id

                                }

                            } );

                            // system requires that we post one at a time ...
                            for (var i = 0; i < fields.length;  i++)
                            {
                                var dataToPush={
                                    activity: fields[i]
                                };

                                console.log( "BaseCampActivity push: ", JSON.stringify(dataToPush));
                                jive.extstreams.pushActivity( instance, dataToPush );
                            }


                        },
                        function(response)
                        {
                            // bad return
                            console.log( "bad query");
                        }
                    );
                }
            });
        }
        })
    },
    10000
);
