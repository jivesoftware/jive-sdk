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

kue = require('kue');
jive = require('../api');

var jobs = kue.createQueue();

jobs.promote();

jobs.process('datapush', function(job, done) {
    //run task
    var tile = job.data;

    //part of exec involved calling jive.tiles.pushData(), which will put formatted data into the push queue
    jive.events.emit(job.data.eventID, job.data.context);

    //schedule new task
    var interval = job.data.interval;
    if (interval) {
        jobs.create('datapush', job.data).delay(interval).save();
    }
    done();
});