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

exports.task = function(context) {
    var statusNames = [ "Poor", "Fair", "Good", "Excellent", "Outstanding" ];

    jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
        if ( instances ) {
            instances.forEach( function( instance ) {
                console.log('running pusher for ', instance.name, 'instance', instance.id );

                count++;

                var level = Number(instance.config.level);
                var dataToPush = {
                    data : {
                        "message" : "Simple Gauge",
                        "sections" : createSections(5),
                        "activeIndex": level,
                        "status" : statusNames[level]
                    }
                };

                jive.tiles.pushData( instance, dataToPush);
            });
        }
    });

    function createSections(numSections) {
        var sections = [];
        for (var i = 0; i < numSections; i++) {
            sections.push({
                "label": "dummy",
                "color": getSectionColor(i, numSections)
            });
        }
        return sections;
    }

    function getSectionColor(secIndex, numSections) {
        var maxGreen = 187,
            blueString = "00",
            red, green;
        if (secIndex < ((numSections - 1) / 2)) {
            red = 255;
            green = Math.round((255 * ((secIndex) / ((numSections - 1) / 2))));
        }
        else if (secIndex > ((numSections - 1) / 2)) {
            green = maxGreen;
            red = Math.round((255 * (1 - ((secIndex - ((numSections - 1) / 2)) / ((numSections - 1) / 2)))));
        }
        else {
            red = 220;
            green = 220;
        }

        var redString = (red < 16 ? "0" + red.toString(16) : red.toString(16)),
            greenString = (green < 16 ? "0" + green.toString(16) : green.toString(16));

        return '#' + redString + greenString + blueString;
    }
};
