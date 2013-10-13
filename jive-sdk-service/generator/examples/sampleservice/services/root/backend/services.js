var jive = require('jive-sdk');

exports.task = new jive.tasks.build(
    // runnable
    function() {
        jive.logger.info("A task ran!");
    },

    // interval (optional)
    5000
);

exports.onBootstrap = function(app) {
    jive.logger.info("This should have run on service bootstrap!");
};


