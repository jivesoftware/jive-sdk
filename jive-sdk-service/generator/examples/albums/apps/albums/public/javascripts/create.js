(function() {
    if (!window.console){console={log:function(s){}}};
    var routes = {
        'gallery-saved/:id'     :         'galleryDrop',
        'gallery-edit-cancel'   :         'close'
    };

    var appContext = {
        defaultRoute: 'gallery-create',
        routes: routes
    };

    window.app = new App();
    app.initialize(appContext);
})();