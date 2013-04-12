var instances = require('./instances');

function Extstreams() {
}

Extstreams.prototype = Object.create({}, {
    constructor: {
        value: Extstreams,
        enumerable: false
    }
});

require('util').inherits( Extstreams, instances );

module.exports = Extstreams;

