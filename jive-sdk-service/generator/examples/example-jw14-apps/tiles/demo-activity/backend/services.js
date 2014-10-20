var jive = require('jive-sdk');
var scheduler = new jive.scheduler.memory();


var sendActivity = function() {

    jive.extstreams.findByDefinitionName('demo-activity').then(function(instances) {
        if (instances) {
            instances.forEach(function(instance) {

                var time = new Date();

                var data = {
                    "activity": {
                        "action": {
                            "name": "posted",
                            "description": "Activity " + time
                        },
                        "actor": {
                            "name": "JiveWorld14 Demo",
                            "email": "user2@localhost"
                        },
                        "object": {
                            "type": "website",
                            "url": "http://www.google.com",
                            "image": "http://localhost:8090/demo-activity/images/jw-128.png",
                            "title": "Activity " + time,
                            "description": "Activity " + time
                        },
                        "jive": {
                            "app": {
                                "appUUID": "f5ef5eed-f56e-5073-87bb-2fa88f5a3b49",
                                "view": "extStreamAppView",
                                "context": {
                                    time: time
                                }
                            }
                        }
                    }
                };

                jive.extstreams.pushActivity(instance, data);
            });
        }
    });

};

exports.onBootstrap = function() {
    var task = new jive.tasks.build(sendActivity, 60000);

    jive.tasks.schedule(task, scheduler);
};