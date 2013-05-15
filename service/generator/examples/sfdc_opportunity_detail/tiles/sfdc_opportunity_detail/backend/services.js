var opportunities = require('./opportunities');
var jive = require('jive-sdk');

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                        opportunities.pullOpportunity(instance).then(function(data){
                            jive.tiles.pushData(instance, data);
                    }).catch(function(err) {
                        jive.logger.error('Error pushing salesforce data to Jive', err);
                    });
                });
            }
        });
    },

    // interval (optional)
    10000
);

