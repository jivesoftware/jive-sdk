/****************************************************
* This file should load AFTER app.js or whichever .js file that defines the onReady, onViewer, onContext and onData functions
*
* Note:  This implmentation has been provided for convenience, developers are not required to use this pattern.
****************************************************/
var app = {

    NO_CONTEXT : "NO_CONTEXT",

    viewContext : { },
    actionContext : { },
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

    fireOnViewer : function() {
      if (onViewer && typeof onViewer === "function") {
        onViewer(this.viewer);
      } // end if
    }, // end function

    fireOnReady : function() {
      if (onReady && typeof onReady === "function") {
        onReady(opensocial.getEnvironment());
      } // end if
    }, // end function

    fireOnViewContext : function() {
      if (onView && typeof onView === "function") {
        /*** DATA CLEANSING ***/
        if (this.viewContext.object === app.NO_CONTEXT) {
          delete this.viewContext.object;
        } // end if
        onView(this.viewContext);
      } // end if
    }, // end function

    fireOnActionContext : function() {
      if (onAction && typeof onAction === "function") {
        /*** DATA CLEANSING ***/
        if (this.actionContext.object === app.NO_CONTEXT) {
          delete this.actionContext.object;
        } // end if
        onAction(this.actionContext);
      } // end if
    }, // end function

    fireOnDataContext : function() {
      if (onData && typeof onData === "function") {
        onData(this.data);
      } // end if
    }, // end function

    init : function() {
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

      this.fireOnReady();
    },

    /*** PROCESS THE VIEW CONTEXT ****/
    handleViewContext : function(context) {
      app.viewContext["currentView"] = app.getCurrentView();
      app.viewContext["params"] = gadgets.views.getParams();
      if (context) {
        osapi.jive.corev3.resolveContext(context,
          function(object) {
            app.viewContext["object"] = object["content"];

            app.fireOnViewContext();
        });
      } else {
        app.viewContext["object"] = app.NO_CONTEXT;
        app.fireOnViewContext();
      } // end if
    }, // end handleViewContext

    /*** PROCESS THE DATA CONTEXT ****/
    handleDataContext : function(key) {
      //console.log('handleDataContext',key);
      app.data = opensocial.data.getDataContext().getDataSet(key);
      app.fireOnDataContext();
    }, // end handleViewContext

    /*************************************************************************************
     * EXAMPLE GET CONTEXT FOR ACTION LINKS
     * NOTE:  YOU MUST INCLUDE THE coreapi-context-resolver-v3.js FILE or the "jive-core-v3-resolver" Feature in your app.xml FOR THIS TO WORK
     *************************************************************************************/
    handleActionContext : function(action,context) {
      //console.log('handleActionContext',action,context);
      app.actionContext["currentView"] = app.getCurrentView();
      app.actionContext["action"] = action;
      app.actionContext["params"] = gadgets.views.getParams();
      app.actionContext["isRTE"] = (context["jive"]["content"]["id"] === -1);
      if (context) {
        if (!app.actionContext["isRTE"]) {
          osapi.jive.corev3.resolveContext(context,
            function(object) {
              app.actionContext["object"] = object["content"];
              app.fireOnActionContext();
          });
        } else {
          app.actionContext["object"] = app.NO_CONTEXT;
          app.fireOnActionContext();
        } // end if
      } // end if
    }, // end handleActionContext

    handleViewer : function(viewer) {
      //console.log('handleViewer',viewer);
      app.viewer = viewer;
      app.fireOnViewer();
    } // end handleViewer
};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));
