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

var jive = require('jive-sdk'),
    q    = require('q'),
    http = require('q-io/http'),
    jira = require('./jira.js');


// query JIRA every 10 seconds
exports.task = [
    {
        'event':'update',
        'interval':10000
    }
];

function pushUpdate(tile) {
    jive.logger.info('pushing update: '+ tile.name +', '+ tile.id );
    var filter   = tile.config.filter;
    var sort = tile.config.sort;
    var viewer = tile.config.viewer;
    var authStore = jive.service.persistence();
    authStore.find('auth', {
        'viewer':viewer
    }).then(function(found) {
        if (found.length > 0) {
            var user = found[0].user;
            var pass = found[0].pass;
            fetchData(filter, user, pass, sort, function(data, filterName) {
                prepareData(tile, data, function(prepared) {
                    jive.tiles.pushData(tile, { data: prepared });
                }, filterName);
            });
        } else {
            jive.logger.warn("could not find auth creds");
        }
    });
}

function fetchData(filter, user, pass, sort, callback) {
    jira.getData(filter, user, pass, sort, function(data, filterName) {
        jive.logger.debug("got data: " + data);
        callback(data, filterName)
    });
}

function prepareData(tile, data, callback, filterName) {
    var config = tile.config;

    var fields = Object.keys(data).map(function(field) {
        return {
            'name':field,
            'value':''+data[field]
        }
    });

    fields.sort(function(a,b) {
        return parseInt(b.value) - parseInt(a.value);
    });

    if (fields.length > 10) {
        fields = fields.slice(0,9);
    }

    var contents = [{ name: config.sort, value: "Number of Issues"}].concat(fields);

    var preparedData = {
        title: 'JIRA: '+filterName,
        contents: contents,
        action: {
            text: 'Take Action',
            'context':{
                filter:config.filter,
                sort:config.sort,
                rows:contents
            }
        }
    };

    jive.logger.debug("Prepared data: " +  JSON.stringify(preparedData, null, 4 ));

    callback(preparedData);
}

exports.eventHandlers = [
    {
        'event': 'update',
        'handler': function() {
            jive.tiles.findByDefinitionName('{{{TILE_NAME}}}').then(function(tiles) {
                tiles.forEach(pushUpdate);
            });
        }
    },
    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(theInstance){
            jive.logger.info("Caught newInstance event, trying to push now.");
            if ( theInstance['name'] == '{{{TILE_NAME}}}' ) {
                pushUpdate(theInstance);
            }
        }
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
