var util = require('util'),
    BaseServer = require('./base-server').BaseServer,
    uuid=require('node-uuid');

util.inherits(JiveIdServer, BaseServer);

exports.JiveIdServer= JiveIdServer;

function JiveIdServer(app, config) {
    JiveIdServer.super_.call(this, app, config);

}

JiveIdServer.prototype.setup = function() {
      this.configTokenEndpoint();
}

JiveIdServer.prototype.configTokenEndpoint = function() {
    var app = this.app;
    var self = this;

    app.post("/v1/oauth2/token", function(req, res) {

        var body = req.body;
        var config = self.config;
        var grantTypeResponses = config['grantTypeResponses'];

        process.send( {oauth2TokenRequest: body});

        var requestCode = body['code'];
        var grantType = body['grant_type'];
        var response = null;
        var responseCode = 500;

        if (grantTypeResponses && grantTypeResponses[grantType]) {
            response = grantTypeResponses[grantType].response;
            responseCode = grantTypeResponses[grantType].statusCode;
        } else if (grantType === 'authorization_code'){
            response = self.getDefaultAuthzResponse();
            responseCode = 200;
        } else if (grantType === 'refresh_token') {
            response = self.getDefaultRefreshResponse();
            responseCode = 200;
        }

        //console.log('JIVE ID RETURNING RESPONSE CODE %d, BODY %s', responseCode, response);
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
    
    if (type === 'changeResponseToGrantTypes') {
        console.log('Received command to change response to grant types, %s', JSON.stringify(operation));
        if (!this.config['grantTypeResponses']){
            this.config['grantTypeResponses'] = {};
        }
        for (var key in operation['grantTypeResponses']) {
            this.config['grantTypeResponses'][key] =  operation['grantTypeResponses'][key];
        }
        return {};
    }

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
        "scope": require('./../functional/test-util').makeGuid(config.clientUrl + (config.port ? ":" + config.port : ""), true, 1234),
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
        "scope": require('./../functional/test-util').makeGuid(config.clientUrl + (config.port ? ":" + config.port : ""), true, 1234),
        "state":null
    };
    return response;
};