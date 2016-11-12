/****************************************************
* This file should load BEFORE main.js, since main.js calls the onReady, onContainer and onViewer methods
* Note:  This implmentation has been provided for convenience, developers are not required to use this pattern.
*
* SEE: Tile API & Development FAQ - https://community.jivesoftware.com/docs/DOC-185776
****************************************************/

//************************************************************************
//NOTE: CALLED AS SOON AS THE FULL CONTEXT IS RESOLVED
//************************************************************************
function onReady(tileConfig,tileOptions,viewer,container) {
  if ( typeof tileConfig !== 'object' ) {
      tileConfig = JSON.parse(tileConfig || {} );
  }

  // Update field with config data
  $("#config_string").text(tileConfig["configString"]);

  // Update field with private property data
  jive.tile.getPrivateProps ( function(props) {
      $("#private_string").text(props["privateString"]);
  });

  // When action button is clicked...
  $("#action").click( function() {

      // Run action
      jive.tile.doAction( this, {
          "privateString" : $("#private_string").text()
      }).then( function(actionData) {

          // Update private property using updatePrivateProps...
          jive.tile.updatePrivateProps ( {
              "privateString" : actionData["privateString"]
          }, function(returnObject) {
              console.log("Updated private properties: ", returnObject);
              $("#private_string").text(returnObject["privateString"]);
          });

          // Resize window
          app.resize();

      }, function() {
          alert("Canceled action");
      });
  });

  app.resize();
} // end function

//************************************************************************
//NOTE: CALLED AS SOON AS THE CONFIG IS RESOLVED
//************************************************************************
function onConfig(tileConfig,tileOptions) {
  console.log('onConfig',tileConfig,tileOptions);
} // end function

//************************************************************************
//NOTE: CALLED AS SOON AS THE CONTAINER IS RESOLVED
//************************************************************************
function onContainer(container) {
  console.log('onContainer',container);
} // end function

//************************************************************************
//NOTE: CALLED AS SOON AS THE VIEWER IS RESOLVED
//************************************************************************
function onViewer(viewer) {
  console.log('onViewer',viewer);
} // end function
