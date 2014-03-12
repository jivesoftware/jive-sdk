var q = require('q');

exports.testSimpleSingleEvent = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event1, { eventListener: 'event1Listener' } );

    // immediate
    setTimeout( function() {
        if ( count == 1 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 250);

    return deferred.promise;
};

exports.testSimpleSingleEventGlobalFireUntargeted = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        }
    );

    scheduler.init();
    scheduler.schedule( event1 );

    // immediate
    setTimeout( function() {
        if ( count == 1 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 250);

    return deferred.promise;
};

exports.testSimpleSingleEventGlobalFireTargeted = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        }
    );

    scheduler.init();
    scheduler.schedule( event1, { eventListener: 'event1Listener' } );

    // immediate
    setTimeout( function() {
        if ( count == 0 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 250);

    return deferred.promise;
};

exports.testSimpleSingleEventMixedFireUntargeted = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        }
    );

    jive.events.registerEventListener( event1,
        function() {
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );


    scheduler.init();
    scheduler.schedule( event1 );

    // immediate
    setTimeout( function() {
        if ( count == 1 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 250);

    return deferred.promise;
};

exports.testSimpleSingleEventMixedFireTargeted = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        }
    );

    jive.events.registerEventListener( event1,
        function() {
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event1, { eventListener: 'event1Listener' } );

    // immediate
    setTimeout( function() {
        if ( count == 1 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 250);

    return deferred.promise;
};

exports.testSimpleIntervalEvent = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init( jive.events.eventHandlerMap, {}, jive );
    scheduler.schedule( event1, { eventListener: 'event1Listener' }, 500 );

    // immediate
    setTimeout( function() {
        if ( count == 2 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 1501);

    return deferred.promise;
};

exports.testSingleEventWithDelay = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    jive.events.registerEventListener( event1,
        function() {
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );


    scheduler.init();
    scheduler.schedule( event1, { eventListener: 'event1Listener' }, undefined, 500 );

    // immediate
    setTimeout( function() {
        if ( count == 1 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 3501);

    return deferred.promise;
};

exports.testIntervalEventWithDelay = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event1 = jive.util.guid();
    var elapsed;

    jive.events.registerEventListener( event1,
        function() {
            if ( !elapsed ) {
                elapsed = new Date().getTime() - now;
            }
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    var now = new Date().getTime();
    scheduler.schedule( event1, { eventListener: 'event1Listener' }, 500, 1000 );

    // immediate
    setTimeout( function() {
        if ( Math.abs(elapsed - 1000) < 100 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 2001);

    return deferred.promise;
};

exports.testSingleEventTimeout = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var event = jive.util.guid();
    jive.events.registerEventListener( event,
        function() {
            return q.defer();
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' }, undefined, undefined, undefined, 200).then( function() {
        deferred.resolve();
    }, function() {
        deferred.reject();
    });

    return deferred.promise;
};

exports.testIntervalEventTimeout = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var event = jive.util.guid();
    var count = 0;

    jive.events.registerEventListener( event,
        function() {
            count++;
            return q.defer();
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' }, undefined, undefined, undefined, 200);

    // immediate
    setTimeout( function() {
        if ( count > 0 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 2001);

    return deferred.promise;
};

exports.testOverlappingIntervalEvents = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event = jive.util.guid();

    jive.events.registerEventListener( event,
        function() {
            var p = q.defer();
            setTimeout( function() {
                count++;
                p.resolve();
            }, 500);

            return p.promise;
        },
        { 'eventListener' : 'event1Listener'}
    );


    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' }, 10 );
    scheduler.schedule( event, { eventListener: 'event1Listener' }, 10 );
    scheduler.schedule( event, { eventListener: 'event1Listener' }, 10 );

    // immediate
    setTimeout( function() {
        if ( count == 3 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 2001);

    return deferred.promise;
};

exports.testOverlappingSingleNonExclusiveEvent = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event = jive.util.guid();
    jive.events.registerEventListener( event,
        function() {
            count++;
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' } );
    scheduler.schedule( event, { eventListener: 'event1Listener' } );

    // immediate
    setTimeout( function() {
        if ( count == 2 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 250);

    return deferred.promise;
};

exports.testOverlappingSingleExclusiveEvent = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count = 0;
    var event = jive.util.guid();
    jive.events.registerEventListener( event,
        function() {
            count++;
            return q.resolve();
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' }, undefined, undefined, true );
    scheduler.schedule( event, { eventListener: 'event1Listener' }, undefined, undefined, true );

    // immediate
    setTimeout( function() {
        if ( count == 1 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 3000);

    return deferred.promise;
};

exports.testConcurrentIntervalEvents = function( jive, testUtils, scheduler ) {
    var deferred = q.defer();

    var count1 = 0;
    var event = jive.util.guid();

    jive.events.registerEventListener( event,
        function() {
            count1++;
            return q.resolve();
        },
        { 'eventListener' : 'event1Listener'}
    );

    var count2 = 0;
    var event2 = jive.util.guid();
    jive.events.registerEventListener( event2,
        function() {
            count2++;
            return q.resolve();
        },
        { 'eventListener' : 'event1Listener'}
    );

    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' }, 500 );
    scheduler.schedule( event2, { eventListener: 'event1Listener' }, 500 );

    // immediate
    setTimeout( function() {
        if ( count1 == 2 && count2 == 2 ) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    }, 1501);

    return deferred.promise;
};

exports.testFailedEvent = function( jive, testUtils, scheduler ) {

    var deferred = q.defer();

    var event = jive.util.guid();
    jive.events.registerEventListener( event,
        function() {
            return q.reject();

        },
        { 'eventListener' : 'event1Listener'}
    );


    scheduler.init();
    scheduler.schedule( event, { eventListener: 'event1Listener' }).then( function(r) {
        deferred.reject(new Error("expected failure"));
    }, function(e) {
        deferred.resolve();
    });

    return deferred.promise;
};

