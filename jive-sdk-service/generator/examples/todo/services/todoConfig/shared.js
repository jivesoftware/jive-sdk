var q = require("q"),
    jive = require('jive-sdk'),
    db = jive.service.persistence();
exports.getJiveURL = function(req) {
    var authorization = req.headers['authorization'],
        jiveUrl;
    if( !authorization) {
        return null;
    }
    var authVars = authorization.split(' ');
    // The authorization has already been validated:
    if (authVars[0] == 'JiveEXTN') {
        // try to parse out jiveURL
        var str = '';
        var authParams = authVars[1].split('&');
        authParams.forEach(function (p) {
            if (p.indexOf('jive_url') == 0) {
                jiveUrl = decodeURIComponent(p.split("=")[1]);
            }
        });
    }
    return jiveUrl;
}

exports.getClientIDForJiveURL = function(jiveUrl) {
    var deferred = q.defer();
    if (jiveUrl) {
        db.findByID("todoConfig", jiveUrl).then(function (settings) {
            deferred.resolve(settings ? settings.clientid : null);
        });
    } else {
        deferred.resolve(null);
    }
    return deferred.promise;
}

exports.getClientIDForRequest = function(req) {
    var jiveUrl = exports.getJiveURL(req);
    return exports.getClientIDForJiveURL(jiveUrl);
};

exports.getClientIDForInstanceConfig = function(instance) {
    var jiveUrl = instance.url.substring(0, instance.url.indexOf("/", 8));
    return exports.getClientIDForJiveURL(jiveUrl);
};