var jive = require('jive-sdk');
var util = require('util');

exports.route = function(req, res) {
    var conf = jive.service.options;
    var cloudalyticsConf = jive.service.options['cloudalytics'];


    var profiles = [];
    for (var x in cloudalyticsConf['profiles']){
        profiles.push({
            id : cloudalyticsConf['profiles'][x]['id'],
            name : cloudalyticsConf['profiles'][x]['name']
            });
    } // end for x

    res.render('start.html',
        {
            host : jive.service.serviceURL(),
            profile :  profiles
        }
    );
};
