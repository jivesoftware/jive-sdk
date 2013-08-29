var https = require("https");

var sampleOauth = require('./routes/oauth/sampleOauth');
var github_helpers = require('./routes/oauth/github_helpers');

exports.getData = function(org, repo, types, ticketID, callback)
{
    console.log ("GITHUB: getData 1 org="+org+" repo=" +repo+" ticket="+ticketID)  ;

    // right now, org holds the full name of the repository which is org/repo'
    var query = "/repos/" + org + "/issues" ;
    return github_helpers.queryGitHubV3(ticketID, sampleOauth, query).then(function(response) {
    //return github_helpers.queryGitHubV3(ticketID, sampleOauth, "/repos/jivesoftware/jive-sdk/issues").then(function(response) {
        var json = response.entity;
        //var json = JSON.parse(response.entity);

        var issues = [];
        var count=0;
        json.forEach(function (issue) {
            //console.log("title=" + issue.title + " state=" + issue.state );
            // 10 max lines in the REPORT tile type. 1 is a header so only 9 more

            if (++count <= 9)
            {
                var newTitle = issue.title;
                // max len = 50 for TABLE but 40 for LIST.  However, the tile itself for TABLE only
                // has room for about 25 with default font/etc so just limit to 40 for now as this code
                // is being used by both TABLE and LIST styles
                if (newTitle.length >= 40)
                {
                    newTitle = issue.title.substring(0,36) ;
                    newTitle += " ..";
                }
                issues.push({
                    title: newTitle,
                    state: issue.state,
                    url: issue.html_url,
                    number: issue.number,
                    timestamp: issue.updated_at,
                    full_title: issue.title,
                    labels : ""
                });

                // now, populate the labels ...
                var lCount=0;
                issue.labels.forEach(function(label){
                    //issues.labels.push({name : label.name });
                    //console.log( "label="+label.name );
                    if (lCount++) issues[count-1].labels +=",";
                    issues[count-1].labels += label.name;
                });

            }
        });
        //console.log("count=", json.length);
        //console.log('the issues are  ' + JSON.stringify(issues, null, 2));

        callback(issues)   ;
        //console.log(JSON.stringify(json, null, 2));


    }).catch(function(err){
            jive.logger.error('Error querying GitHub', err);
        });

}