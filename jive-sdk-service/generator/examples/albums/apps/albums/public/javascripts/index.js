(function() {

    if (!window.console) {console={log:function(s){}}};

    var routes = {
        'gallery-select/:id'     :         'galleryEdit'
    };

    var appContext = {
        routes: routes
    };
    window.app = new App();
    app.initialize(appContext);
})();
