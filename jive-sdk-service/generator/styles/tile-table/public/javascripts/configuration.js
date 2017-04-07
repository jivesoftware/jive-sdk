//************************************************************************
//NOTE: CALLED AS SOON AS THE FULL CONTEXT IS RESOLVED
//************************************************************************
function onReady(tileConfig,tileOptions,viewer,container) {
  console.log('onReady',tileConfig,tileOptions,viewer,container);
  if ( typeof tileConfig === "string" ) {
      tileConfig = JSON.parse(tileConfig);
  }

  var json = tileConfig || {
      "startSequence": "1"
  };

  // prepopulate the sequence input dialog
  $("#start_sequence").val( json["startSequence"]);

  $("#btn_submit").click( function() {
      tileConfig["startSequence"] = $("#start_sequence").val();
      jive.tile.close(tileConfig, {} );
      app.resize();
  });
} // end function

// //************************************************************************
// //NOTE: CALLED AS SOON AS THE CONFIG IS RESOLVED
// //************************************************************************
// function onConfig(tileConfig,tileOptions) {
//   console.log('onConfig',tileConfig,tileOptions);
// } // end function
//
// //************************************************************************
// //NOTE: CALLED AS SOON AS THE CONTAINER IS RESOLVED
// //************************************************************************
// function onContainer(container) {
//   console.log('onContainer',container);
// } // end function
//
// //************************************************************************
// //NOTE: CALLED AS SOON AS THE VIEWER IS RESOLVED
// //************************************************************************
// function onViewer(viewer) {
//   console.log('onViewer',viewer);
// } // end function
