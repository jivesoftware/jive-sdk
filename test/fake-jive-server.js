var util = require('util'),
    BaseServer = require('./base-server').BaseServer;

util.inherits(FakeJiveServer, BaseServer);

exports.FakeJiveServer = FakeJiveServer;

function FakeJiveServer(app, config) {
    FakeJiveServer.super_.call(this, app, config);
}

FakeJiveServer.prototype.setup = function() {


}

FakeJiveServer.prototype.doOperation = function(operation) {
    var tryBase = FakeJiveServer.super_.prototype.doOperation.call(this, operation);
    if (tryBase) {
        return tryBase; //handled
    }

}