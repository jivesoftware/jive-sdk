gadgets.util.registerOnLoadHandler(function() {

    window.app = new App();

    // register a listener for embedded experience context
    opensocial.data.getDataContext().registerListener('org.opensocial.ee.context', function (key) {
        var embeddedContext = opensocial.data.getDataContext().getDataSet(key);

        console.log("==== registerListener ====");
        console.log("embedded context:", embeddedContext);

        if (!window.console){console={log:function(s){}}};
        var appContext = {
            embedded: embeddedContext,
            defaultRoute: 'gallery-view/' + embeddedContext.target.context.galleryID + '/' + embeddedContext.target.context.userid
        };
        
        window.app.initialize(appContext);
    });
});
