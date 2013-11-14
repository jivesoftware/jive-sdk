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

/*jshint laxcomma:true */

var jive = require('jive-sdk')
    , q    = require('q')
    , http = require('q-io/http')
    , jenkins = require('./jenkins.js');

var colorMap = {
    'blue':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_green.png',
    'red':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_red.png',
    'disabled':'http://cdn1.iconfinder.com/data/icons/function_icon_set/warning_48.png'
}

exports.task = new jive.tasks.build(function() {
    jive.tiles.findByDefinitionName('jenkins').then(function(tiles) {
        tiles.forEach(pushUpdate);
    });
}, 60000);

function pushUpdate(tile) {
    console.log('pushing update: '+ tile.name +', '+ tile.id, tile);

    var obj = new jenkins.Jenkins();
    obj.getData(tile.config.jobs.slice(), tile.config.views.slice(), function(data) {
        prepareData(data, function(prepared) {
            jive.tiles.pushData(tile, { data: prepared });
        });
    });
}

function prepareData(data, callback) {
    var fields = Object.keys(data).map(function(field) {
        var shortfield = field;
        if (shortfield.length > 40) {
            shortfield = field.slice(shortfield.length-40);
        }
        return {
            'text':shortfield,
            'icon':colorMap[data[field].color],
            'linkDescription':'Visit this job in Jenkins',
            'action':{
                'context': {
                    'url':data[field].url,
                    'color':data[field].color,
                    'name':field
                }
            }
        }
    });

    if (fields.length > 10) {
        fields = fields.slice(0,10);
    }

    if (fields.length == 0) {
        fields.push({
            'text':"All Jobs Passing!",
            'icon':colorMap.blue
        });
    }

    var preparedData = {
        title: 'Currently Failing Jenkins Jobs',
        contents: fields,
        action: {
            text: 'View All Jobs in Jenkins',
            url: 'https://jenkins.jiveland.com'
        }
    };

    console.log("Prepared data", preparedData);

    callback(preparedData);
}

exports.eventHandlers = [

    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(theInstance){
            jive.logger.info("Caught newInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                pushUpdate(theInstance);
            }        }
    },

    {
        'event': jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : function(theInstance){
            jive.logger.info("Caught updateInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                pushUpdate(theInstance);
            }
        }
    }
];
