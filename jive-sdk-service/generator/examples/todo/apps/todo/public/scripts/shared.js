var host, app, baseRESTUrl;

var DEV_MODE = false;  // Only enable this during development.  It will significantly effect performance.

if( !host ) {
    var appXMLUrl = gadgets.util.getUrlParameters()['url'];
    if( appXMLUrl ) {
        // parts will look like: ["http:", "", "localhost:8090", "osapp", "todo", "app.xml"]
        var parts  = appXMLUrl.split("/");
        host = parts[0] + "//" + parts[2];
        app = parts[4];
        baseRESTUrl = host + "/{{{TILE_PREFIX}}}todo/todos";
    }
}

var defaultErrorHandler = function(response) {
    $("#status").html("ERROR:" + response.error.message + "(" + response.error.code + ")");
}