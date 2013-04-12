var instances = require('./instances');

function Tiles() {
}

Tiles.prototype = Object.create({}, {
    constructor: {
        value: Tiles,
        enumerable: false
    }
});

require('util').inherits( Tiles, instances );

module.exports = Tiles;

