var util = require('util');
var instances = require('./instances');
var pusher = require('./dataPusher');

function Extstreams() {
}

util.inherits( Extstreams, instances );

Extstreams.prototype.getCollection = function() {
    return "extstreamInstance";
};

Extstreams.prototype.pushActivity = function (client_id, tileInstance, activity, callback) {
    pusher.pushActivity(client_id, tileInstance, activity, callback || function(){});
};

Extstreams.prototype.pushComment = function (client_id, tileInstance, comment, commentURL, callback) {
    pusher.pushComment(client_id, tileInstance, commentURL, comment, callback || function(){});
};

module.exports = Extstreams;

