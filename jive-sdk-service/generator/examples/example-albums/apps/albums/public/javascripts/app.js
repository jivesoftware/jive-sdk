function App() {

    var container = new Container();
    var initialize = function ( context ) {
        if ( context ) {
            container.setAppContext( context );
        }
        if ( container.initialize) {
            container.initialize();
        }
        var router = new Router();
        router.initialize(container);
    };

    Backbone.sync = function (method, model, options) {
        container.sync(method, model, options);
    };

    Backbone.View.prototype.close = function () {
        this.remove();
        this.unbind();
        if (this.onClose) {
            this.onClose();
        }
    };

    return {
        initialize: initialize,

        getAbsoluteUrl: function(path) {
            return gadgets.util.getUrlParameters()['url'].replace(/(\/app.xml)|(\/gadget.xml)/, path);
        },
            
        getProxiedUrl: function(path) {
            return gadgets.io.getProxyUrl(gadgets.util.getUrlParameters()['url'].replace(/(\/app.xml)|(\/gadget.xml)/, path)) + "&nocache=1";
        }
    };
}