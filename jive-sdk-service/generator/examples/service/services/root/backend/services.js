var jive = require('jive-sdk');

exports.task = new jive.tasks.build(
    // runnable
    function() {
        // read the counter from the db
        jive.service.persistence().findByID('counter', 'currentCount')
            .then(
                // output the result
                function(result) {
                    var count = 0;
                    if ( !result ) {
                        result = count;
                    } else {
                        count = parseInt(result);
                    }
                    count++;
                    jive.logger.info("This is an example of a recurring task: iteration #", count);
                return count;
            })
            .then( function( count ){
                // write the counter back to the db
                return jive.service.persistence().save( 'counter', 'currentCount', count );
            }
        );
    },

    // interval (optional)
    5000
);

exports.onBootstrap = function(app) {
    jive.logger.info("******************************");
    jive.logger.info("Welcome to the sample service. This is displayed as a result of custom bootstrap logic.");
    jive.logger.info("Test this server by calling its endpoints: ");
    jive.logger.info("  http://[HOST]:8090/root/autowired/route/example   An endpoint that was autowired from directory structure.");
    jive.logger.info("  http://[HOST]:8090/root/explicit/route/example    An endpoint whose path was explicitly provided.");
    jive.logger.info("  http://[HOST]:8090/root/public.html               A static resource served from the service's public directory.");
};


