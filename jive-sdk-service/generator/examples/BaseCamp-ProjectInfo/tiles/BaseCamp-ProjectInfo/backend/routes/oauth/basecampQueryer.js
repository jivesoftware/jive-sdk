var url = require('url');
var jive = require('jive-sdk');

var sampleOauth = require('./sampleOauth.js');
var basecamp_helpers = require('./basecamp_helpers');

exports.handleBasecampQuery = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var queryPart = url_parts.query;

    var query = queryPart["query"];
    var ticketID = queryPart["ticketID"];
    var returnType = queryPart["id"] ;

    var uri = encodeURIComponent(query);

    console.log("query='" + query +"' ticketID='" + ticketID + "'" + " URI="+uri)  ;



    basecamp_helpers.queryBasecampV1(ticketID, sampleOauth, query).then(function (response) {
        res.writeHead(200, { 'Content-Type': 'application/json' });


        if (returnType != "all")
        {
            // this is a hack. If returnType isn't 'all', then this is our original one and only
            // use of this function - to get the repositories for a user after authentication
            // return just a list of the repositories the user has access to
            var body = response['entity'];
            var repos=[];
            body.forEach(function(repo)   {
                repos.push({ name : repo.name, full_name : repo.full_name})  ;
            } );

            res.end(JSON.stringify(repos) );
        }
        else
            res.end(JSON.stringify(response['entity']));
    }).catch(function (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(err));
        });
};
exports.handleBasecampPost = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var queryPart = url_parts.query;

    var query = queryPart["query"];
    var ticketID = queryPart["ticketID"];
    var accountID = queryPart["accountID"]
    var uri = encodeURIComponent(query);

    console.log("query='" + query +"' ticketID='" + ticketID + "'" + " accountID="+accountID)  ;

    basecamp_helpers.postBasecampV1(accountID, ticketID, sampleOauth, query, req.body).then(function (response) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response['entity']));
    }).catch(function (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(err));
        });

};

exports.isAuthenticated = function(req, res ) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var viewerID = query['viewerID'];
    var ticketID = query['ticketID'];
    var getInfo = (url_parts.pathname === "/oauth/getAuthorizationInfo") ;

    console.log("isAuthenticated?? viewerID="+viewerID+" ticketID="+ticketID+" getAuthInfo="+getInfo);

    if (viewerID == undefined)
        viewerID = ticketID;

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
            var accessToken = found[0]['accessToken'];
            //var host = found[0]['accessToken']['instance_url'];


            basecamp_helpers.getAuthorizationInfo(viewerID, sampleOauth).then(function (response) {
                var headers = { 'Content-Type': 'application/json', 'Cache-Control' : 'no-Cache', 'Pragma' : 'No-Cache'};
                res.writeHead(200, headers );
                if (response.statusCode == 200)
                {
                    if (getInfo)
                    {
                        // request to return the authorization info ...
                        // in this case, we are returning all the projects that the user has access to ...
                        retStatus = response.entity;
                    }
                    else
                    {
                        // request to just authenticate user ...
                        retStatus = {ticketID : viewerID, status : 'ok'}  ;
                    }
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