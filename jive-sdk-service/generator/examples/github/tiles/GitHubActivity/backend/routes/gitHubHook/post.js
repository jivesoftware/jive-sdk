var jive = require("jive-sdk");
var count=0;

/*
** NOTES:
**  1. need to make sure that the activity instance is configured for the data that is posted here! i.e. that it
**     is configured for the same repository ....
 */
var gitHubHookRouteHandler = function(req, res) {
    res.status(200);
    res.end("jive app got the hook request!");

    jive.logger.debug( "gitHubHookRouteHandler:");

    var body = req.body;

    var msg1="";
    var msg2="" ;
    var url="";
    var doPush=false;
    var doUpdateTile=false; // set to true if we want to try and update associated GitHubIssues-List tiles ..
    var fullName="";        // full name of repository for comparison to see if we have a tile instance match
    var userName="";
    if (body['commits'] != undefined) {
        console.log( "GHHRH: commit payload ...");

        msg1 = "'" + body['pusher']['name'] +
               "' pushed to '" + body['repository']['master_branch'] +
               "' @ " + body['repository']['name'];

        msg2 = body['commits'][0]['message'];
        url = body['commits'][0]['url'];

        doPush = true;
        var repository =   body['repository']['url'];      // full path to repository
        // early dev, full path = "https://github.com/organization/repository"
        // so, the full name of repository starts at index = 19
        fullName = repository.substring(19);
        userName = body['pusher']['name'];
    } else if (body['action'] != undefined ) {
        if (body['action'] == 'created') {
            // created an issue comment ...
            jive.logger.debug( "GHHRH: issue comment created payload ...");
            msg1 = "'" + body['sender']['login'] +
                   "' commented on issue '" + body['issue']['title'] +
                   "' @ " + body['repository']['full_name'];

            msg2 = body['comment']['body'];
            url = body['issue']['html_url'];

            doPush = true;
            fullName =   body['repository']['full_name'];
            userName = body['sender']['login'];
        } else if (body['action'] == 'opened') {
            // opened a new issue ...
            jive.logger.debug( "GHHRH: issue opened payload ...");
            msg1 = "'" + body['sender']['login'] +
                   "' opened issue  '" + body['issue']['title'] +
                   "' @ " + body['repository']['full_name'];
            msg2 = body['issue']['body'];
            url = body['issue']['html_url'];

            doPush = true;
            doUpdateTile = true;
            fullName =   body['repository']['full_name'];
            userName = body['sender']['login'];
        } else if (body['action'] == 'closed') {
            // closed an issue ...
            jive.logger.debug( "GHHRH: issue closed payload ...");
            msg1 =   "'" + body['sender']['login'] +
                "' closed issue  " + body['issue']['title'] +
                "' @ " + body['repository']['full_name'];

            // no msg associated with closed (at this point)
            url = body['issue']['html_url'];

            doPush = true;
            doUpdateTile = true;
            fullName =   body['repository']['full_name'];
            userName = body['sender']['login'];
        } else {
            jive.logger.debug("GHHRH: unhandled payload body action = " + body['action'])  ;
        }
    } else {
        // unhandled payload ...
        jive.logger.debug( "GHHRH: unhandled payload ...");
        jive.logger.debug( "BODY=", body) ;
    }

    jive.logger.debug( "GHHRH: do push=" + doPush)  ;

    if (doPush) {
        jive.extstreams.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(instances) {
            if ( instances ) {
                instances.forEach( function( instance ) {
                    pushTileInstance(instance, userName, fullName, url, msg1, msg2);
                });
            } else {
                jive.logger.debug( "gitHubHookRouteHandler: no instances")
            }
        });

        if (doUpdateTile) {
            // look for a tile that is monitoring the same repository and then tell it to update ...
            // we could also make sure this tile is using the same instance of the Jive app, but why
            // not just update all the tiles everywhere?
             jive.tiles.findByDefinitionName( '{{{TILE_NAME}}}' ).then( function(tiles) {
                 tiles.forEach( function(tile) {
                     var config = tile['config']  ;
                     var name = "GitHubIssues-List";
                     if (config != undefined && config['organization'] == fullName)
                          jive.events.emit("activityUpdateInstance." + name, tile)  ;
                 });
             });
        }
    }

    jive.logger.debug( "- gitHubHookRouteHandler") ;
};

exports.gitHubHook_service = {
    'path' : '/gitHubHook',
    'verb' : 'post',
    'route': gitHubHookRouteHandler
};

function pushTileInstance(instance, userName, fullName, url, msg1, msg2) {
    var config = instance['config'];

    if (config == undefined ) {
        return; // don't even bother ...
    }

    if (config['posting'] === 'off' ) {
        return;
    }

    // in early dev version, organization actually holds the full repository name
    if (config['organization'] != fullName) {
        // this POST doesn't match the repository for this instance
        return;
    }

    jive.logger.debug('running pusher for ', instance.name, 'instance', instance.id );
    jive.logger.debug('running pusher for ' + instance.name + ' instance ' + instance.id );
    count++;

    var dataToPush = {
        "activity":
        {
            "action":{
                "name":"posted",
                "description":"GitHub repository activity"
            },
            "actor":{
                "name": userName,
                "email":""
            },
            "object":{
                "type":"website",
                "url": url,
                "image":"http://png-3.vector.me/files/images/7/3/737157/github_thumb.png",
                "title": msg1,
                "description": msg2 /*+ " @ " + new Date().getTime()*/
            },
            "externalID": '' + new Date().getTime()
        }
    };

    jive.logger.debug( "pushing data ....");
    jive.extstreams.pushActivity(instance, dataToPush);
}

