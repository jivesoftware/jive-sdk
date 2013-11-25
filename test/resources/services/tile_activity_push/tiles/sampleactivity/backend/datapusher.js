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

function getFormattedData(count) {
    return {
        "activity": {
            "action": {
                "name": "posted",
                "description": "Activity " + count
            },
            "actor": {
                "name": "Actor Name",
                "email": "actor@email.com"
            },
            "object": {
                "type": "website",
                "url": "http://www.google.com",
                "image": "http://placehold.it/102x102",
                "title": "Activity " + count,
                "description": "Activity " + count
            },
            "externalID": '' + new Date().getTime()
        }
    };
}

exports.eventHandlers = [
    {
        'event' : 'pushMeActivity',
        'handler' : function(context) {
            var instance = context['instance'];
            return jive.extstreams.pushActivity(instance, getFormattedData(1));
        }
    }
];
