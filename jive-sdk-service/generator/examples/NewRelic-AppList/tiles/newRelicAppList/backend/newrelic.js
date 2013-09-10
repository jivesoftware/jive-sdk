/*
 * Copyright 2013 Jive Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jshint laxcomma:true */

var request = require('request');
var jive = require('jive-sdk');
var parseXML = require('xml2js').parseString;
var q = require('q')

var baseurl = "https://api.newrelic.com/api/v1/";

exports.getApplications = getApplications;
exports.getApplicationMetrics = getApplicationMetrics;
exports.getApplicationsWithMetricData = getApplicationsWithMetricData;

function getAccountID()
{
    var options = jive.service.options['api-newrelic']

    //console.log( "getAccountID");
    var headers = {
        'x-api-key' : options['api-key']
    };

    return jive.util.buildRequest( baseurl + "accounts.xml", 'GET', null, headers, null).then(
        // success
        function(response) {
            var body = response.entity.body;
            //console.log( "getAccountID: OK") ;
            return q.nfcall(parseXML, body, {'ignoreAttrs' : true}).then(
                function (result) {
                    //console.log( "getAccountID: parse results from XML to JSON to APPID", result) ;
                    var json = JSON.stringify(result);
                    //console.log( "Number of accounts= ", result['accounts']['account'].length);
                    var accountID = String(result['accounts']['account'][0]['id']);
                    accountID = accountID.trim();
                    //console.log( "accountID= '" + accountID +"'");

                    var retData = {accountID : accountID}   ;

                    return retData;
                },
                function (error) {
                    console.log("getAccountID: XML parse failed");
                });

        } ,
        // fail
        function(error) {
            console.log("getAccountID: query NG", error)  ;
        }
    );
}
function getApplicationMetricsRecursive( index, apps)
{
    //console.log( "GAMR: index="+index+" of "+(apps.length-1));
    if (index  > (apps.length-1)) {
        // done ...
        return apps;
    }

    var appID = apps[index].id;
    var acctID = apps[index].acctID
    // process
    var options = jive.service.options['api-newrelic']

    //console.log( "getAccountID");
    var headers = {
        'x-api-key' : options['api-key']
    };

    return jive.util.buildRequest( baseurl + "accounts/" + acctID + "/applications/" + appID + "/threshold_values.xml", 'GET', null, headers, null).then(
        // success
        function(response) {
            var body = response.entity.body;
            //console.log( "getApplicationMetricsRecursive: OK from NR") ;
            return q.nfcall(parseXML, body ).then(
                function (result) {
                    //console.log( "getApplicationsMetricsRecursive: OK parse");
                    var json = JSON.stringify(result);
                    var data=[];
                    result['threshold-values']['threshold_value'].forEach( function (tv) {
                        var name = tv['$'].name;
//console.log( "name="+name );
                        data[name] = {
                            metric_value : Number(tv['$'].metric_value),
                            formatted_metric_value : tv['$'].formatted_metric_value,
                            threshold_value : tv['$'].threshold_value,
                            appID: appID}

                        //console.log( "TV: '"+tv['$'].name + " val: " + tv['$'].formatted_metric_value + " thresh:" + tv['$'].threshold_value );
                    });

                    apps[index].rt = data['Response Time'];
                    apps[index].apdex = data['Apdex'] ;
                    apps[index].tp = data['Throughput'];
                    apps[index].er = data['Error Rate'];
                    apps[index].max_threshold = Math.max( apps[index].rt.threshold_value, apps[index].er.threshold_value,
                        apps[index].tp.threshold_value, apps[index].apdex.threshold_value );

                    // now - recurse to keep this a serial operation through all apps ...
                    //console.log( "GAMR: "+index+" ", apps[index])
                    return getApplicationMetricsRecursive(index+1, apps).then(
                        function() {
                            //console.log("- getAccountMetricsRecursive: Done")
                            return apps;
                        },
                        function() {
                            // fail
                            //console.log("- getAccountMetricsRecursive: NG")
                            //var data=[];
                            //return data;
                        })
                    //return data;


                },
                function (error) {
                    console.log("- getAccountMetricsRecursive: XML parse failed");
                    var data=[];
                    return data;
                }
            );




        } ,
        // fail
        function(error) {
            console.log("- getAccountMetricsRecursive: query NG", error)  ;
            var data=[];
            return data;
        }
    );
}

function getApplicationsWithMetricData()
{
    // returns a sorted list of all applications along with the relevant metric data ...
    // sorting is done first by the max error threshold for the monitored metrics and
    // then by the throughput .. this generates a list similar what the home  page of New Relic shows ...
    return getApplications().then(
        function(apps)
        {
            // success
            return getApplicationMetricsRecursive( 0, apps).then(
                function(apps)
                {
                    // success
                    //console.log( "GAMR: OK ")  ;

                    apps.sort(function(a,b)
                        {
                            if (a.max_threshold == b.max_threshold)
                                return (b.tp.metric_value > a.tp.metric_value ? 1 : (b.tp.metric_value < a.tp.metric_value ? -1 :0));
                            return b.max_threshold - a.max_threshold;
                        }
                    )

                    return apps;
                },
                function(err)
                {
                      // fail
                    console.log( "GAMR: NG")
                    return apps;
                }
            );
        },
        function(err)
        {
            // failure ...
        }) ;

}
function getApplicationMetrics(acctID, appID)
{
    //console.log( "+ getApplicationMetrics");

    var options = jive.service.options['api-newrelic']

    //console.log( "getAccountID");
    var headers = {
        'x-api-key' : options['api-key']
    };

    return jive.util.buildRequest( baseurl + "accounts/" + acctID + "/applications/" + appID + "/threshold_values.xml", 'GET', null, headers, null).then(
        // success
        function(response) {
            var body = response.entity.body;
            console.log( "getApplicationMetrics: OK from NR") ;
            return q.nfcall(parseXML, body ).then(
                function (result) {
                    console.log( "getApplicationsMetrics: OK parse");
                    var json = JSON.stringify(result);
                    var data=[];
                    result['threshold-values']['threshold_value'].forEach( function (tv) {
                        var name = tv['$'].name;
//console.log( "name="+name );
                        data[name] = {
                            metric_value : tv['$'].metric_value,
                            formatted_metric_value : tv['$'].formatted_metric_value,
                            threshold_value : tv['$'].threshold_value,
                            appID: appID}

                        //console.log( "TV: '"+tv['$'].name + " val: " + tv['$'].formatted_metric_value + " thresh:" + tv['$'].threshold_value );
                    });
                    return data;
                },
                function (error) {
                    console.log("- getAccountMetrics: XML parse failed");
                    var data=[];
                    return data;
                });

        } ,
        // fail
        function(error) {
            console.log("- getAccountMetrics: query NG", error)  ;
            var data=[];
            return data;
        }
    );
}

function getApplications(accountID)
{
    //console.log("+ getApplications");

    var options = jive.service.options['api-newrelic']

    //console.log( "getAccountID");
    var headers = {
        'x-api-key' : options['api-key']
    };

    return getAccountID().then(
        // success ...
        function(response)
        {
            //console.log( "getApplications: OK", response);
            // now, get the list of accounts ...
            var accountID=response['accountID']
            return jive.util.buildRequest( baseurl + "accounts/" + accountID + "/applications.xml",
                  'GET', null, headers, null).then(
                      function(response)  {
                          // success ...
                          var body = response.entity.body;
                          return q.nfcall(parseXML, body, {'ignoreAttrs' : true}).then(
                              function ( result) {
                                  var json = JSON.stringify(result);
                                  //console.log( "Number of apps= ", result['applications']['application'].length);

                                  // build up a list of the apps ...
                                  if(1) {
                                  // this works, but I now need to get the metrics as well, so start anew below ...
                                  var apps=[];
                                  var count=0;
                                  result.applications.application.forEach(function(app){
                                      apps.push({
                                          name : app.name,
                                          id: Number(app.id),
                                          acctID :  accountID
                                      });
                                      count++;
                                  });
                                  //console.log( "getApplications: OK", apps);
                                  return apps;
                                  }
                                  else {
                                    // this code tries to add the metrics in ....

                                  var apps=[];
                                  var count=0;
                                  var numOfApps = result.applications.application.length;
                                  result.applications.application.forEach(function(app){

                                      return getApplicationMetrics( accountID, app.id[0]).then(
                                        function (results)  {
                                            // success
                                              var er= results['Error Rate'] ;
                                              var apdex=results['Apdex'];
                                              apps.push({
                                                  name : app.name,
                                                  id: Number(app.id[0]) ,
                                                  errorRate : er
                                              });
                                              count++;
                                              if (count == numOfApps)
                                              {
                                                  // kludge ???  We have found all the data now .. just fullfill the promise ..
                                                  console.log( "getApplications: got data for " + count + " of " + numOfApps + " apps") ;

                                                  return apps;
                                              }
                                        },
                                      function (err) {
                                          console.log("getApplications: Metrics NG") ;
                                      });

                                  });
                                  }

                              },
                              function (error) {
                                  // failure ...
                                  console.log("getApplications: XML Parse NG", error)  ;
                              });

                      },
                      function(err) {
                          // fail ..
                          console.log("getApplications: query NG", error)  ;
                      } );

        },
        // fail
        function(err)
        {
            console.log( "getApplications: getAccount NG", err)  ;
        }
    );
}




