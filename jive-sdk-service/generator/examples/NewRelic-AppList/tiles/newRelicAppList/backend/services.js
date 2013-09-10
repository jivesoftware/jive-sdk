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
var newRelic = require("./newrelic");


// need to find some better public domain/hosted icons or figure another solution here ...
var colorMap = {
    '0': 'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_grey.png', // this doesn't exist!
    '1':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_green.png',

    '2':'http://cdn1.iconfinder.com/data/icons/function_icon_set/warning_48.png',
    '3':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_red.png'
}
function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    newRelic.getApplicationsWithMetricData().then (
    //newRelic.getApplications().then (
        function(response)   {
            // good ..
            var data = response;
             var fields  =  Object.keys(data).map( function (field) {
                if (field > 9) return;   // limit to 10 lines in list (system issue)
                 var icon = 'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_green.png';

                 if (data[field].max_threshold > 0 && data[field].max_threshold <= 3)
                     icon = colorMap[data[field].max_threshold];

                 return {
                    text: data[field].name[0]  ,
                    icon: icon,
                    'linkDescription': 'Visit this Application in New Relic' ,
                    'action'  : {context : { appName : data[field].name[0],
                                            acctID: data[field].acctID,
                                            appID : data[field].id,
                                             rt : data[field].rt.formatted_metric_value,
                                             apdex : data[field].apdex.formatted_metric_value,
                                             tp : data[field].tp.formatted_metric_value,
                                             er : data[field].er.formatted_metric_value,
                                             rt_thres : data[field].rt.threshold_value,
                                            apdex_thres : data[field].apdex.threshold_value,
                                            tp_thres : data[field].tp.threshold_value,
                                            er_thres : data[field].er.threshold_value
                                        }
                                }
                 }


            } );

            var dataToPush = {
                data: {
                    "title": "New Relic Applications List",
                    "contents": fields,

                    "action": {
                        text: "Goto New Relic",
                        url: 'https://www.newrelic.com'
                    }
                }
            };

            jive.tiles.pushData(instance, dataToPush);

        } ,
        function(err)  {
            // bad ...
            console.log( "Error getting data from New Relic ")
        }
    );
}



exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    10000
);
