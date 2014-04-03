(function() {
    if (!window.console){console={log:function(s){}}};

    var routes = {
        'gallery-select/:id'     :         'galleryDrop'
    };

    var appContext = {
        context: 'insert',
        routes: routes
    };
    window.app = new App();
    app.initialize(appContext);
})();
