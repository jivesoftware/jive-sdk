var util = require('util');
var instances = require('./instances');
var pusher = require('./dataPusher');

function Tiles() {
}

Tiles.prototype = Object.create({}, {
    constructor: {
        value: Tiles,
        enumerable: false
    }
});

util.inherits( Tiles, instances );

Tiles.prototype.getCollection = function() {
    return "tileInstance";
};

Tiles.prototype.pushData = function (client_id, tileInstance, data, callback) {
    pusher.pushData(client_id, tileInstance, data, callback || function(){});
};

module.exports = Tiles;

