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

    fireState : function(func,arguments,requireAllArguments) {
      //console.log('****','Function',func,window[func]);
      if (window[func] && typeof window[func] === "function") {
          if (requireAllArguments) {
            if (arguments && arguments.length > 0) {
              var checkArgs = arguments.filter(
                function(arg) {
                    return (arg !== null && arg != null && typeof arg !== "undefined" && arg !== undefined && arg != undefined);
                } // end function
              );
              if (checkArgs.length == arguments.length) {
                //console.log('****',func,'arguments check PASSED, firing...');
                window[func].apply(null,arguments);
              } else {
                //console.log('****',func,'arguments are required NOT required, firing...');
              } // end if
            }
          } else {
            //console.log('****',func,'arguments check not required, firing...');
            window[func].apply(null,arguments);
          } // end if
      } else {
        //console.log('****',func,'not defined, ignoring...');
      } // end if
    }, // end function

    fireOnViewer : function() {
      this.fireState("onViewer",[ this.viewer ],true);
    }, // end function

    fireOnReady : function() {
      this.fireState("onReady",[ opensocial.getEnvironment() ],true);
    }, // end function

    fireOnViewContext : function() {
      /*** DATA CLEANSING ***/
      if (this.viewContext.object === app.NO_CONTEXT) {
        delete this.viewContext.object;
      } // end if
      this.fireState("onView",[ this.viewContext ],true);
    }, // end function

    fireOnActionContext : function() {
      /*** DATA CLEANSING ***/
      if (this.actionContext.object === app.NO_CONTEXT) {
        delete this.actionContext.object;
      } // end if
      this.fireState("onAction",[ this.actionContext ],true);
    }, // end function

    fireOnDataContext : function() {
      this.fireState("onData",[ this.data ],true);
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
        if (context["jive"] && context["jive"]["context"]) {
          app.data = context["jive"]["context"];
          app.fireOnDataContext();
        } // end if
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
