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
var github = require("./github")

var colorMap = {
    'green':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_green.png',
    'red':'http://cdn1.iconfinder.com/data/icons/function_icon_set/circle_red.png',
    'disabled':'http://cdn1.iconfinder.com/data/icons/function_icon_set/warning_48.png'
};

function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    var config = tile.config;

    github.getData( org, repo, types, config.ticketID, function(data) {
        callback(data)
    });
}

function prepareData(tile, data, callback) {
    var config = tile.config;
    jive.logger.info("PREPARE DATA: ticketID=" + config.ticketID)

    // use path for repository: organization / repository
    var repository = config["organization"];        // for now, this holds the full name ...

    // to check .. can we pass an object to the action so that we have a cleaner interface ?
    var fields = Object.keys(data).map(function(field) {
        return {
            text: '' + data[field].title,
            'icon': (data[field].labels.search("bug") >= 0)? colorMap["red"] : colorMap["green"],
            'linkDescription':'Visit this job in Github',
            'action':{
                url : jive.service.options['clientUrl'] + '/{{{TILE_NAME}}}/action?id='+ new Date().getTime(),
                context : {url:data[field].url,title:data[field]['full_title'],number:data[field].number,repo:repository, labels:data[field].labels  }
            }
        }
    });

    var preparedData = {
        title : "Repository: '" + repository +"'" ,
        contents : fields,
        action: {
            text: 'Github' ,
            'url': 'https://www.github.com'
        }
    };

    jive.logger.info("Prepared data", JSON.stringify(preparedData));

    callback(preparedData);
}

function pushUpdate(tile) {
    var config = tile.config;
    console.log('pushing update: '+ tile.name +','+ config.organization + ", " + tile.jiveCommunity);

    github.getData(tile.config.organization, tile.config.repository, "", tile.config.ticketID, function(data) {
        prepareData(tile, data, function(prepared) {
            jive.tiles.pushData(tile, { data: prepared });
        });
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(tiles) {
            tiles.forEach(pushUpdate) ;
        });
    },

    // interval (optional)
    10000
);

exports.eventHandlers = [

    {
        'event': 'activityUpdateInstance',
        'handler' : function(theInstance){
            jive.logger.info("Caught activityUpdateInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                pushUpdate(theInstance);
            }
        }
    },
    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(theInstance){
            jive.logger.info("Caught activityUpdateInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                pushUpdate(theInstance);
            }
        }
    },
    {
        'event': jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : function(theInstance){
            jive.logger.info("Caught activityUpdateInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                pushUpdate(theInstance);
            }
        }
    }
];
