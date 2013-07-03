var url = require('url');
var jive = require("../api");

exports.oauthRegister = function(req, res ) {
    var registration = req.body;

    jive.logger.debug('Recieved client app registration', registration );

    // todo xxx - security?
    jive.service.jiveOAuth.register( registration).then(
        function() {
            // success
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify({}) ); // todo? what?
        }, function(error) {
            // err
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end( JSON.stringify(error) ); // todo? what?
        }
    );
};