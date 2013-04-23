var util = require('util'),
    BaseServer = require('./base-server').BaseServer,
    uuid=require('node-uuid');

util.inherits(JiveIdServer, BaseServer);

exports.JiveIdServer= JiveIdServer;

function JiveIdServer(app, config) {
    JiveIdServer.super_.call(this, app, config);

}

JiveIdServer.prototype.setup = function() {

    var config = this.config;
    var app = this.app;
    var self = this;

    var tokenResponses = config['tokenResponses'];

    app.post("/v1/oauth2/token", function(req, res) {

        var body = req.body;

        process.send( {oauth2TokenRequest: body});

        var requestCode = body['code'];
        var grantType = body['grant_type'];
        var response = null;
        var responseCode = 500;

        if (tokenResponses && tokenResponses[grantType]) {
            response = tokenResponses[grantType].response;
            responseCode = tokenResponses[grantType].response;
        } else if (grantType === 'authorization_code'){
            response = self.getDefaultAuthzResponse();
            responseCode = 200;
        } else if (grantType === 'refresh_token') {
            response = self.getDefaultRefreshResponse();
            responseCode = 200;
        }


        res.writeHead(responseCode, {"Content-Type": "application/json"});
        res.end(JSON.stringify(response));


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


JiveIdServer.prototype.getDefaultAuthzResponse = function() {
    var config = this.config;
    var response =
    {
        "access_token": uuid.v4(),
        "token_type":"bearer",
        "refresh_token": uuid.v4(),
        "expires_in": 3599,
        "scope": require('./test-util').makeGuid(config.clientUrl + (config.port ? ":" + config.port : ""), true, 1234),
        "state":null
    };
    return response;
};

JiveIdServer.prototype.getDefaultRefreshResponse = function() {
    var config = this.config;
    var response =
    {
        "access_token": uuid.v4(),
        "token_type":"bearer",
        "refresh_token": uuid.v4(),
        "expires_in": 3599,
        "scope": require('./test-util').makeGuid(config.clientUrl + (config.port ? ":" + config.port : ""), true, 1234),
        "state":null
    };
    return response;
};