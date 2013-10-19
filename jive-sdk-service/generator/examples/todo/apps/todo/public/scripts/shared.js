var host, app, baseRESTUrl, clientid;

if( !host ) {
    var appXMLUrl = gadgets.util.getUrlParameters()['url'];
    if( appXMLUrl ) {
        // parts will look like: ["http:", "", "localhost:8090", "osapp", "todo", "app.xml"]
        var parts  = appXMLUrl.split("/");
        host = parts[0] + "//" + parts[2];
        app = parts[4];
        baseRESTUrl = host + "/" + app + "/todos";
    }
}

var defaultErrorHandler = function(response) {
    $("#status").html("ERROR:" + response.error.message + "(" + response.error.code + ")");
}

osapi.jive.corev3.systemExtProps.get({}).execute(function (resp) {
    if( resp && resp.content ) {
        clientid = resp.content.clientid;
    }
});