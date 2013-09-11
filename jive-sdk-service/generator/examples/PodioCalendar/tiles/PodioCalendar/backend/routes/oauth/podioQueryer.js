var url = require('url');
var jive = require('jive-sdk');

var sampleOauth = require('./sampleOauth.js');
var podio_helpers = require('./podioHelpers');

exports.getProjectInfo = function( req, res)  {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var viewerID = query['viewerID'];
    var ticketID = query['ticketID'];

    console.log("getProjectInfo: viewerID="+viewerID+" ticketID="+ticketID);

    if (viewerID == undefined)
    {
        viewerID = ticketID;
    }

    if (viewerID == undefined)
    {
        // still undefined, we can't continue .. just return and don't put anything in the body ...
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end();
        return;
    }
    // see if we even have a token for the passed viewerID ...
    var tokenStore = sampleOauth.getTokenStore();

    var retStatus;

    return tokenStore.find('tokens', {'ticket': viewerID }).then( function(found) {
        if ( found != undefined && found[0] != undefined) {
            var accessToken = found[0]['accessToken']['access_token'];


            podio_helpers.getProjectInfo(viewerID, sampleOauth).then(function (response) {
                var headers = { 'Content-Type': 'application/json', 'Cache-Control' : 'no-Cache', 'Pragma' : 'No-Cache'};
                res.writeHead(200, headers );
                if (response.statusCode == 200)
                {
                    retStatus = response.entity;
                }
                else
                    retStatus = {ticketID : viewerID, status : "ng - " + response.statusCode};
                res.end(JSON.stringify(retStatus));

            }).catch(function (err) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    retStatus = {ticketID : viewerID, status : 'ng - token invalid for viewer'};
                    res.end(JSON.stringify(retStatus));
                });

        }
        else
        {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            retStatus = {ticketID : viewerID, status : 'ng - token not found for viewer'};
            res.end(JSON.stringify(retStatus));

        }


    }, function() {
        // can't event access token store ....
        res.writeHead(403, { 'Content-Type': 'application/json' });
        retStatus = {ticketID : viewerID, status : 'ng - token store not found'};
        res.end(JSON.stringify(retStatus));

    }) ;
};
exports.isAuthenticated = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var viewerID = query['viewerID'];
    var ticketID = query['ticketID'];

    console.log("isAuthenticated?? viewerID="+viewerID+" ticketID="+ticketID);

    if (viewerID == undefined)
    {
        viewerID = ticketID;
    }

    if (viewerID == undefined)
    {
        // still undefined, we can't continue .. just return and don't put anything in the body ...
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end();
        return;
    }
    // see if we even have a token for the passed viewerID ...
    var tokenStore = sampleOauth.getTokenStore();

    var retStatus;

    return tokenStore.find('tokens', {'ticket': viewerID }).then( function(found) {
        if ( found != undefined && found[0] != undefined) {
            var accessToken = found[0]['accessToken']['access_token'];
            //var host = found[0]['accessToken']['instance_url'];


            podio_helpers.getAuthorizationInfo(viewerID, sampleOauth).then(function (response) {
                var headers = { 'Content-Type': 'application/json', 'Cache-Control' : 'no-Cache', 'Pragma' : 'No-Cache'};
                res.writeHead(200, headers );
                if (response.statusCode == 200)
                {
                    retStatus = {ticketID : viewerID, status : 'ok'}  ;
                }
                else
                    retStatus = {ticketID : viewerID, status : "ng - " + response.statusCode};
                res.end(JSON.stringify(retStatus));

            }).catch(function (err) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    retStatus = {ticketID : viewerID, status : 'ng - token invalid for viewer'};
                    res.end(JSON.stringify(retStatus));
                });

        }
        else
        {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            retStatus = {ticketID : viewerID, status : 'ng - token not found for viewer'};
            res.end(JSON.stringify(retStatus));

        }


    }, function() {
        // can't event access token store ....
        res.writeHead(200, { 'Content-Type': 'application/json' });
        retStatus = {ticketID : viewerID, status : 'ng - token store not found'};
        res.end(JSON.stringify(retStatus));

    }) ;
};

