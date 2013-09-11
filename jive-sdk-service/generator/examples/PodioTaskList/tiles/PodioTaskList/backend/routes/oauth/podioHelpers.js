var jive = require("jive-sdk");
var util = require('util');
var request = require("request") ;

exports.getProjectInfo = getProjectInfo;
exports.getAuthorizationInfo = getAuthorizationInfo;

function getProjectInfo(ticketID, myOauth){

    var tokenStore = myOauth.getTokenStore();
    var headers = {};

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found[0] != undefined ) {
            var accessToken = found[0]['accessToken']['access_token'];

            headers = {

            };

            console.log("getProjectInfo: " + "https://api.podio.com/app/v2/");

            // get a list of apps that this user has access to ...
            return jive.util.buildRequest(
                    "https://api.podio.com/app/v2/?oauth_token=" + accessToken,
                    "GET", null, null, null).then (function(response)
            {

                // ok, now find the projects app and return that data ...
                if (response.entity.length > 0)
                {
                    for (var i=0; i<response.entity.length; i++)
                    {
                        console.log( "app " + i + " = " + response.entity[i].config.name + " app_id=" + response.entity[i].app_id) ;
                        if (response.entity[i].config.name == "Projects")
                        {
                            console.log ( "found projects app ...");
                            var postData = {
                                "sort_by" : "app_item_id",
                                "sort_desc" : false
                            };
                            var data = JSON.stringify(postData);

                            headers = {
                                'Content-Type' : 'application/json',
                                'Content-Length' : data.length
                            };

                            return jive.util.buildRequest(
                                    "https://api.podio.com/item/app/" + response.entity[i].app_id + "/filter/?oauth_token=" + accessToken,
                                    "POST", data, headers, null);
                        }
                    }
                    return "";
                }
                else
                   return "";


            });
        }

        throw Error('No token record found for ticket ID=' + ticketID);
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error querying Podio', err);
            return err;
        }
    );
};

function getAuthorizationInfo(ticketID, myOauth){

    var tokenStore = myOauth.getTokenStore();
    var uri = "/user" ;
    var headers = {};

    return tokenStore.find('tokens', {'ticket': ticketID }).then( function(found) {
        if ( found[0] != undefined ) {
            var accessToken = found[0]['accessToken']['access_token'];

            headers = {
             };

            // just try to get user information ...
            console.log("getAuthorizationInfo: " + "https://api.podio.com" + uri );
            return jive.util.buildRequest(
                    "https://api.podio.com" + uri + "?oauth_token="+accessToken ,
                    'GET', null, headers, null)
        }

        throw Error('No token record found for ticket ID=' + ticketID);
    }).then(
        // success
        function(response) {
            return response;
        },

        // fail
        function(err) {
            jive.logger.error('Error querying Podio', err);
            return err;
        }
    );
};
