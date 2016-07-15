/****************************************************
* This file should load AFTER app.js or whichever .js file that defines the onReady, onViewer, onContext and onData functions
*
* Note:  This implmentation has been provided for convenience, developers are not required to use this pattern.
****************************************************/
var app = {

    NO_CONTEXT : "NO_CONTEXT",

    hasFiredViewer : false,
    hasFiredContext : false,
    context : { },
    data : null,
    viewer : null,

    resize : function() {
      //console.log('resize');
      /*** DELAYED TO MAKE SURE DOM HAS SETTLED ***/
      setTimeout(function() {
        gadgets.window.adjustHeight();
        gadgets.window.adjustWidth();
      },200);
    },

    getCurrentView : function() {
      var currentView = location.href.substr(location.href.indexOf('view=')+'view='.length);
      currentView = currentView.substr(0,currentView.indexOf('&'));
      return currentView;
    },

    loadUI : function() {
      if (!this.hasFiredViewer && this.viewer && onViewer && typeof onViewer === "function") {
        this.hasFiredViewer = true;
        onViewer(this.viewer);
      } // end if

      if (!this.hasFiredContext && this.context["object"] && onContext && typeof onContext === "function") {
        this.hasFiredContext = true;
        if (this.context["object"] === app.NO_CONTEXT) {
          delete this.context.object;
        } // end if
        onContext(this.getCurrentView(),this.context);
      } // end if

      if (this.viewer && this.context["object"] && onReady && typeof onReady === "function") {
        onReady(this.viewer,this.context,opensocial.getEnvironment());
      } // end if

    }, // end function

    init : function() {
      app.context["params"] = gadgets.views.getParams();

      // RESOLVE THE DATA CONTEXT (IF AVAILABLE)
      // NOTE: THIS WONT FIRE IF NOT PRESENT, SO CANT BE PART OF THE CONTEXT
      opensocial.data.getDataContext().registerListener('org.opensocial.ee.context',gadgets.util.makeClosure(this, this.handleDataContext));

      // RESOLVE THE VIEWER
      osapi.jive.corev3.people.getViewer().execute(gadgets.util.makeClosure(this, this.handleViewer));

      // RESOLVE THE VIEWER
      osapi.jive.core.container.getLaunchContext(gadgets.util.makeClosure(this, this.handleViewContext));

      /*** RESOLVE ANY ACTIONS DEFINED IN app.js > ACTION_IDS ***/
      var actionScope = this;
      function registerActionLoaders(actionIds) {
          for (id of actionIds) {
            gadgets.actions.updateAction({id:id, callback: gadgets.util.makeClosure(actionScope, actionScope.handleActionContext, id) });
          } // end for x
      } // end registerLoader

      if (ACTION_IDS && ACTION_IDS.constructor === Array && ACTION_IDS.length > 0) {
        registerActionLoaders(ACTION_IDS);
      } // end if
    },

    /*** PROCESS THE VIEW CONTEXT ****/
    handleViewContext : function(context) {
      app.context["type"] = "view";
      app.context["name"] = app.getCurrentView();
      if (context) {
        osapi.jive.corev3.resolveContext(context,
          function(object) {
            app.context["object"] = object["content"];
            app.loadUI();
        });
      } else {
        app.context["object"] = app.NO_CONTEXT;
        app.loadUI();
      } // end if
    }, // end handleViewContext

    /*** PROCESS THE DATA CONTEXT ****/
    handleDataContext : function(key) {
      //console.log('handleDataContext',key);
      app.data = opensocial.data.getDataContext().getDataSet(key);
      if (app.data && onData && typeof onData === "function") {
        onData(app.data);
      } // end if
    }, // end handleViewContext

    /*************************************************************************************
     * EXAMPLE GET CONTEXT FOR ACTION LINKS
     * NOTE:  YOU MUST INCLUDE THE coreapi-context-resolver-v3.js FILE or the "jive-core-v3-resolver" Feature in your app.xml FOR THIS TO WORK
     *************************************************************************************/
    handleActionContext : function(action,context) {
      //console.log('handleActionContext',action,context);
      if (context) {

        app.context["type"] = "action";
        app.context["name"] = action;
        app.context["isRTE"] = (context["jive"]["content"]["id"] === -1);

        if (!app.context["isRTE"]) {
          osapi.jive.corev3.resolveContext(context,
            function(object) {
              app.context["object"] = object["content"];
              app.loadUI();
          });
        } else {
          app.context["object"] = app.NO_CONTEXT;
          app.loadUI();
        } // end if
      } // end if
    }, // end handleActionContext

    handleViewer : function(viewer) {
      //console.log('handleViewer',viewer);
      app.viewer = viewer;
      app.loadUI();
    } // end handleViewer
};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));
