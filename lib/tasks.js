var task = require('./task');
var scheduler = new (require('./scheduler'));

exports.build = function( runnable, interval, context ) {
    return new task(runnable, interval, context );
};

exports.schedule = function(task, key, interval, context) {
    return scheduler.schedule( task, key, interval, context );
};