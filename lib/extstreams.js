var util = require('util');
var instances = require('./instances');
var pusher = require('./dataPusher');

function Extstreams() {
}

util.inherits( Extstreams, instances );

Extstreams.prototype.getCollection = function() {
    return "extstreamInstance";
};

Extstreams.prototype.pushActivity = function ( tileInstance, activity, callback) {
    pusher.pushActivity(tileInstance, activity, callback || function(){});
};

Extstreams.prototype.pushComment = function ( tileInstance, comment, commentURL, callback) {
    pusher.pushComment(tileInstance, commentURL, comment, callback || function(){});
};

module.exports = Extstreams;

