var count = 0;
var jive = require("jive-sdk");

function processTileInstance(instance) {
    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id);

    count++;

    var dataToPush = {
        data: {
            "title": "Simple Counter",
            "contents": [
                {
                    "text": "Selected: " + instance['config']['opportunityID'],
                    "icon": "http://farm4.staticflickr.com/3136/5870956230_2d272d31fd_z.jpg",
                    "linkDescription": "Current counter."
                }
            ],
            "config": {
                "listStyle": "contentList"
            },
            "action": {
                "text": "Add a Todo",
                "context": {
                    "mode": "add"
                }
            }
        }
    };

    jive.tiles.pushData(instance, dataToPush).then(function(e){
        console.log('*success*');
    }, function(e) {
        console.log('*err*');
    });
}

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( 'samplesfdc' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    processTileInstance(instance);
                });
            }
        });
    },

    // interval (optional)
    5000
);