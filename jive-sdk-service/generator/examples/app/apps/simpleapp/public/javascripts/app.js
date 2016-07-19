/************************************************************************
  STEP 1 - Update Your Action IDs to Match your app.xml
  See: /apps/simpleapp/public/app.xml
************************************************************************/
var ACTION_IDS = [
  "example.app.content.all.action",
  "example.app.content.document.action",
  "example.app.content.discussion.action",
  "example.app.content.question.action",
  "example.app.content.document.binary.action",
  "example.app.content.blogpost.action",
  "example.app.content.idea.action",
  "example.app.content.event.action",
  "example.app.content.poll.action",
  "example.app.content.video.action",
  "example.app.createmenu.action",
  "example.app.places.all.action",
  "example.app.places.space.action",
  "example.app.places.project.action",
  "example.app.places.group.action",
  "example.app.places.settings.all.action",
  "example.app.places.settings.space.action",
  "example.app.places.settings.project.action",
  "example.app.places.settings.group.action",
  "example.app.rte.action"
];

/************************************************************************
  STEP 2 - Use this method if you want to run code after OpenSocial has loaded the environemnt
  NOTE: This is marginally better than jQuery onReady, but not required.
        //var jiveURL = opensocial.getEnvironment()['jiveUrl'];
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onReady(env) {
  console.log('onReady',env);
  var jiveURL = env["jiveUrl"];

  //TODO: ADD IN UI INIT STUFF

  app.resize();
} // end function

/************************************************************************
  STEP 3 - Use this method if you only want to perform something once the Viewer has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onViewer(viewer) {
  console.log("onViewer",viewer);
  $("#currentUser").html("<pre>"+JSON.stringify(viewer,null,2)+"</pre>");
} // end function

/************************************************************************
  STEP 4 - Use this method if you only want to perform something once the View Context has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onView(context) {
  console.log("onView",context);

  if (context["currentView"]) {
    $('span.viewContext').append('<em>'+context["currentView"]+"</em>");
  } // end if

  if (context["params"]) {
    $('#paramsContext').html('<pre>'+JSON.stringify(context["params"],null,2)+"</pre>");
  } else {
    $('#paramsContext').html('No Params Found');
  } // end if

  if (context["object"]) {
    $("#currentViewContext").append("<pre>"+JSON.stringify(context["object"],null,2)+"</pre>");
  } // end if

  $('#paramsSampleLink').click(function() {
    gadgets.views.requestNavigateTo(context["currentView"], { timestamp: new Date().toString() });
  });

} // end function

/************************************************************************
  STEP 5 - Use this method if you only want to perform something once the Action Context has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onAction(context) {
  console.log("onAction",context);
  $('span.actionContext').append('<em>'+context["action"]+'</em>');
  $("#currentActionContext").append("<pre>"+JSON.stringify(context["object"],null,2)+"</pre>");

  if (context["isRTE"]) {
    $('#btnEmbedApp').click(embedAppReferenceSimple);
    $('#btnEmbedAppProg').click(embedAppReferenceProg);
    $('#btnEmbedMarkup').click(embedMarkUp);
    $('#embed-actions').show();
  } // end if
} // end function

/************************************************************************
  STEP 6 - Use this method if you only want to perform something once the Data Context has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onData(data) {
  console.log("onData",data);
  $("#currentActionContext").html("<p><strong>Data Context</strong></p>");
  $("#currentActionContext").append("<pre>"+JSON.stringify(data,null,2)+"</pre>");
} // end function


/* ########################################################################################
   ########################################################################################
   ###### THE FOLLOWING FUNCTIONS ARE CALLED FROM onContext FUNCTION (see above)  #########
   ###### AND ARE ONLY MEANT TO SHOW HOW TO PERFORM VARIOUS RTE INJECTIONS W/APPS #########
   ########################################################################################
   ######################################################################################## */

/*** SEE: https://community.jivesoftware.com/docs/DOC-66636 FOR MORE DETAILS ***/
/*** SEE: https://github.com/jivesoftware/jive-sdk/blob/6ba453332d3e6feab694e718e4e74f48314911e4/jive-sdk-service/generator/examples/example-sampleapps/apps/rtejsondropper/public/javascripts/main.js ***/
function embedMarkUp() {
  var html = '<p align="center"><img src="/api/core/v3/people/1/avatar" /><br/>Example HTML Embedded from !app.  Output is a simple HTML string.  The string can be static or even a composite of API data concatenated and then INSERTED</p>';
  osapi.jive.core.container.editor().insert(html);
}

/*** SEE: https://community.jivesoftware.com/docs/DOC-66636 FOR MORE DETAILS ***/
function embedAppReferenceProg() {
  var context = {
     data: {
         display: {
             type: 'text',
             icon: 'images/icon16.png',
             label: 'jivedev (!app)'
         },
         target: {
             type: 'embed',
             view: 'rte-action', // View  in app.xml
             context: {
                 timestamp : new Date().toString(),
                 data : {
                     name: 'Example Data Programmatic'
                 }
             }
         }
     }
  };

  osapi.jive.core.container.artifacts.create(
      context,
      'example.app.rte.action',
      function (markupResponse) {
        console.log('markup',markupResponse.markup,'error',markupResponse.error);
        var html = '<p align="center"><strong>Programmatic Embed</strong><br/>';
        if (markupResponse.error) {
          console.log("Error creating !app App Reference",markupResponse.error);
          html += '<span style="color: red;">'+markupResponse.error+'</span>';
        } else {
          html += '<div>'+markupResponse.markup+'</div>';
          html = html.replace('')
        } // end if
        html += '</p>';
        osapi.jive.core.container.editor().insert( html );
      },
      false,
      true
    );
  } // end embedAppReferenceProg

  /*** SEE: https://community.jivesoftware.com/docs/DOC-66636 FOR MORE DETAILS ***/
  function embedAppReferenceSimple() {
      osapi.jive.core.container.closeApp({
         data: {
             display: {
                 type: 'text',
                 icon: 'images/icon16.png',
                 label: 'jivedev (!app)'
             },
             target: {
                 type: 'embed',
                 view: 'rte-action', // View  in app.xml
                 context: {
                     timestamp : new Date().toString(),
                     data : {
                         name: 'Example Data Simple'
                     }
                 }
             }
         }
      });
    } // end embedAppReferenceSimple
