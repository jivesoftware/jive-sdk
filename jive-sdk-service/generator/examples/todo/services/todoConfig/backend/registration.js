var jive = require("jive-sdk" );

function processRegistration(context) {
    var db = jive.service.persistence();
    var licenseKey = jive.util.guid();
    var tenantID = context['tenantId'];

    // using tenantID as licenseKey table primary key
    db.save( 'licenseKey', tenantID, {
        'licenseKey' : licenseKey
    }).then( function() {
            jive.logger.info('Persisted license key', licenseKey, 'for tenantID', tenantID, '(', context['jiveUrl'], ')');
        });
}

exports.eventHandlers = [
    {
        'event' : jive.constants.globalEventNames.CLIENT_APP_REGISTRATION_SUCCESS,
        'handler' : processRegistration
    }
];
