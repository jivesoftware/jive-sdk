var util = require('util'),
    BaseServer = require('./base-server').BaseServer;

util.inherits(JiveIdServer, BaseServer);

exports.JiveIdServer= JiveIdServer;

function JiveIdServer(app, config) {
    JiveIdServer.super_.call(this, app, config);
}

JiveIdServer.prototype.setup = function() {
    var allowedAuthzCode = null;

    var conf = this.config;
    var app = this.app;

    if (conf.allowedAuthzCode) {
        allowedAuthzCode = conf.allowedAuthzCode;
    }

    app.post("/v1/oauth2/token", function(req, res) {

        var body = req.body;

        process.send( {oauth2TokenRequest: body});

        var requestCode = body['code'];

        //If we aren't requiring a particular authz code or the request supplied the correct one
        if (!allowedAuthzCode || allowedAuthzCode && requestCode == allowedAuthzCode) {

            var response = {
                "access_token": uuid.v4(),
                "token_type":"bearer",
                "refresh_token": uuid.v4(),
                "expires_in": 3599,
                "scope": require('./test-util').makeGuid(conf.clientUrl + (conf.port ? ":" + conf.port : ""), true, 1234),
                "state":null};

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(response));
        }
        else {
            res.writeHead(400, {"Content-Type": "application/json"});
            res.end(JSON.stringify({"error": "Invalid auth code " + requestCode}));
        }

    });

}



JiveIdServer.prototype.doOperation = function(operation) {
    var tryBase = JiveIdServer.super_.prototype.doOperation.call(this, operation);
    if (tryBase) {
        return tryBase; //handled
    }

    var type = operation['type'];


    return null;
}