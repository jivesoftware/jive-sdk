#Adding High Availability

High availability in the jive-sdk requires adding two new dependencies. The first will eliminate the use of file based persistence and will incorporate a real datastore, specifically, mongoDB. The second will add internal queuing and scheduling using redis and kue so that incoming requests can be spread across nodes. When using this configuration, you should install mongoDB and redis before adding the dependencies to your node configuration files. Also, each platform may have additional prerequisites. For example, on Mac, you'll need to install xcode, and on Windows, python and .Net framework.

To add these new dependencies, you just need to add the follwing entries to package.json and jiveclientconfiguration.json.

*package.json*

    "jive-persistence-mongo" : "*",
    "jive-scheduler-kue" : "*"

*jiveclientconfiguration.json*

    "persistence": "jive-persistence-mongo",
    "scheduler": "jive-scheduler-kue"

Now, when you do an npm update, the required dependencies will be pulled into node.