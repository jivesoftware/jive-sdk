var url = require('url');
var jive = require("../api");

exports.oauthRegister = function(req, res ) {
    var registration = req.body;

    jive.logger.debug('Recieved client app registration', registration );

    jive.service.community.register( registration ).then(
        function() {
            // success
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify({"status": "ok" }) );
        }, function(error) {
            // err
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify(error) );
        }
    );
};