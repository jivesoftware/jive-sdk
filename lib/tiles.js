var util = require('util');
var instances = require('./instances');
var pusher = require('./dataPusher');

function Tiles() {
}

util.inherits( Tiles, instances );

Tiles.prototype.getCollection = function() {
    return "tileInstance";
};

Tiles.prototype.pushData = function (tileInstance, data, callback) {
    pusher.pushData(tileInstance, data, callback || function(){});
};

module.exports = Tiles;

