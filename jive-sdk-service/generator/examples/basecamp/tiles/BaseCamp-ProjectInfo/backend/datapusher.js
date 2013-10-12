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
var basecamp_Helpers = require( "./routes/oauth/basecamp_helpers");
var sampleOauth = require("./routes/oauth/sampleOauth") ;


// we're going to just use the data we received from the config for now as it isn't clear
// that the project name or description can be changed once the project is created. So ..
// no reason to query Basecamp for updated data on this tile ...
exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( "{{{TILE_NAME}}}" ).then( function(tiles) {
            //console.log( "length = ", tiles.length)
            tiles.forEach( function( tile ) {
                var config = tile.config;

                var query = "/projects/" + config['id'] + ".json";
                var url;
                url = "https://basecamp.com/" + tile.config['accountID']  + "/projects/" + tile.config['id'] ;

                basecamp_Helpers.queryBasecampV1( config['accountID'], config['ticketID'], sampleOauth, query).then(
                    function(response){
                        // good return ...
                        var data = response.entity ;

                        var creator="** unknown **";

                        if (data['creator'] != undefined)
                            creator = data['creator']['name'];

                        var description = data['description'] ;
                        var project = data['name'];


                        if (description.length > 50)
                        {
                            description = description.substring( 0, 46)  ;
                            description += " ..";
                        }
                        if (project.length > 50)
                        {
                            project = project.substring( 0, 46);
                            project += " ..";
                        }

                        var dataToPush = {
                            "data":
                            {
                                "title": "Basecamp Project Information",
                                "contents": [
                                    {
                                        "name": "Project Name",
                                        "value" : project
                                    },
                                    {
                                        "name": "ID",
                                        "value": tile.config['id']
                                        //"url" : url
                                    } ,
                                    {   "name" : "Description",
                                        "value" : description
                                    },
                                    {   "name" : "Created_By",
                                        "value" : creator
                                    }
                                ],
                                "action":{
                                    text : "Take a closer look ..." ,
                                    'context' : {name: data['name'], description: data['description'], id:tile.config['id'], url: url}
                                }
                            }
                        };

                        //console.log("Prepared data", JSON.stringify(dataToPush));

                        jive.tiles.pushData( tile, dataToPush );
                    },
                    function(response)
                    {
                        // bad return
                        console.log( "bad Project Info query");
                    }
                );
            } );
        });
    },
    10000
);