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

var jive = require("jive-sdk");
var q = require('q');

exports.eventHandlers = [

    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(theInstance){
            var webhookCallback = jive.service.serviceURL() + '/webhooks';
            var jiveCommunity = theInstance['jiveCommunity'];

            var ticketID = theInstance['config']['ticketID'];

            function doWebhook(accessToken) {
                jive.webhooks.register(
                        jiveCommunity, undefined, theInstance['config']['parent'],
                        webhookCallback, accessToken
                    ).then(function (webhook) {
                        webhook['tileInstanceID'] = theInstance['id'];

                        var webhookEntity = webhook['entity'];
                        var webhookToSave = {
                            'object': webhookEntity['object'],
                            'events': webhookEntity['event'],
                            'callback': webhookEntity['callback'],
                            'url': webhookEntity['resources']['self']['ref'],
                            'id': webhookEntity['id'],
                            'tileInstanceID': theInstance['id']
                        };

                        jive.webhooks.save(webhookToSave);
                    });
            }
            jive.community.find( { 'jiveCommunity' : jiveCommunity }, true).then( function(community) {

                if ( community && community['oauth'] && community['oauth']['access_token'] ) {
                    doWebhook( community['oauth']['access_token']);
                } else {
                    jive.service.persistence().find('tokens', {'ticket': ticketID }).then(function (found) {
                        var accessToken = found ? found[0]['accessToken']['access_token'] : undefined;
                        doWebhook( accessToken );
                    });
                }
            });

        }
    }

];
