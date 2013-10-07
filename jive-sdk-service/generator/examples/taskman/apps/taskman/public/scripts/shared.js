var host, app, baseRESTUrl;

if( !host ) {
    var url = gadgets.util.getUrlParameters()['url'];
    if( url ) {
        // parts will look like: ["http:", "", "localhost:8090", "osapp", "taskman", "app.xml"]
        var parts  = url.split("/");
        host = parts[0] + "//" + parts[2];
        app = parts[4];
        baseRESTUrl = host + "/" + app + "/tasks";
    }
}
