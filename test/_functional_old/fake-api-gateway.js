var util = require('util'),
    BaseServer = require('./base-server').BaseServer;

util.inherits(FakeApiGateway, BaseServer);

exports.FakeApiGateway = FakeApiGateway;

function FakeApiGateway(app, config) {
    FakeApiGateway.super_.call(this, app, config);
}

FakeApiGateway.prototype.setup = function() {


}

FakeApiGateway.prototype.doOperation = function(operation) {
    var tryBase = FakeApiGateway.super_.prototype.doOperation.call(this, operation);
    if (tryBase) {
        return tryBase; //handled
    }

}