/****************************************************
* This file should load AFTER view.js or container.js, or whichever .js file that defines the onReady, onContainer and onViewer
*
* Note:  This implmentation has been provided for convenience, developers are not required to use this pattern.
*
* SEE: Tile API & Development FAQ - https://community.jivesoftware.com/docs/DOC-185776
****************************************************/
var app = {

  config : null,
  options : null,
  viewer : null,
  container : (window["isAddOnConfigure"]) ? (window["isAddOnConfigure"]) : null,

  resize : function() {
    /*** DELAYED TO MAKE SURE DOM HAS SETTLED ***/
    setTimeout(function() {
      gadgets.window.adjustHeight();
      gadgets.window.adjustWidth();
    },200);
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

  loadUI : function() {
      this.fireState("onViewer",[ this.viewer ],true);

      this.fireState("onContainer",[ this.container ],true);

      this.fireState("onReady",[ this.config,this.options,this.viewer,this.container ],true);

  }, // end function

  init: function(config,options) {
    this.config = config;
    this.options = options;

    this.fireState("onConfig",[ this.config,this.options],true);

    /*** CALLS APP FRAMEWORK AND ASKS FOR THE VIEWER TO BE PASSED BACK ***/
    osapi.jive.corev3.people.getViewer().execute(gadgets.util.makeClosure(this, this.handleViewer));

    /*** CALLS THE TILE FRAMEWORK TO DISCOVER WHERE IT IS LOCATED ***/
    jive.tile.getContainer(gadgets.util.makeClosure(this, this.handleContainer));
  }, // end function

  handleViewer : function(viewer) {
    this.viewer = viewer;
    this.loadUI();
  },

  handleContainer : function(container) {
    this.container = container;
    this.loadUI();
  }

};

jive.tile.onOpen(
    function(config, options) {
      app.init(config,options);
});
