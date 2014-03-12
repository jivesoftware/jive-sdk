var url = require('url');
var jive = require("../api");

/**
 * @module addOnRoutes
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * <b>POST /oauthRegister</b>
 * <br>
 * @param req
 * @param res
 */
exports.oauthRegister = function(req, res ) {
    var registration = req.body;

    jive.logger.debug('Received client app registration', registration );

    schedule(jive.constants.tileEventNames.CLIENT_APP_REGISTRATION, registration, res);
};

/**
 * <b>POST /oauthUnregister</b>
 * <br>
 * @param req
 * @param res
 */
exports.oauthUnregister = function(req, res ) {
    var data = req.body;

    jive.logger.debug('Received client app unregistration', data );

    schedule(jive.constants.tileEventNames.CLIENT_APP_UNREGISTRATION, data, res);
};

function schedule(event, data, res) {
    var promise =  jive.context.scheduler.schedule(event, data);
    var success = function() {
        // success
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end( JSON.stringify({"status": "ok" }) );
    };
    var failure = function(error) {
        // err
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end( JSON.stringify(error || {'error':'error'}));
    };
    promise.then(success,failure);
}