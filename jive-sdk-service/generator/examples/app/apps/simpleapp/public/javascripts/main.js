var app = {

    jiveURL : opensocial.getEnvironment()['jiveUrl'],

    getCurrentView : function() {
      var currentView = location.href.substr(location.href.indexOf('view=')+'view='.length);
      currentView = currentView.substr(0,currentView.indexOf('&'));
      return currentView;
    },

    init : function() {

      // add code that should run on page load here
      osapi.jive.corev3.people.getViewer().execute(gadgets.util.makeClosure(this, this.handleViewer));

      /*** EXAMPLE GET CONTEXT FOR APP VIEWS ****/
      osapi.jive.core.container.getLaunchContext(gadgets.util.makeClosure(this, this.handleViewContext));

      /*** EXAMPLE GET CONTEXT FOR ACTION LINKS ***/
      var actionScope = this;
      function registerActionLoaders(actionIds) {
          for (id of actionIds) {
            gadgets.actions.updateAction({id:id, callback: gadgets.util.makeClosure(actionScope, actionScope.handleActionContext, id) });
          } // end for x
      } // end registerLoader

      /**** THESE VALUES MUST MATCH THE ACTION IDS IN YOUR app.xml ******/
      registerActionLoaders([
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
      ]);

      var currentView = this.getCurrentView();
      $('#paramsSampleLink').click(function() {
        gadgets.views.requestNavigateTo(currentView, { timestamp: new Date().toString() });
      });

      // resize app window to fit content
      gadgets.window.adjustHeight();
      gadgets.window.adjustWidth();

    },

    /*** EXAMPLE GET CONTEXT FOR APP VIEWS ****/
    handleViewContext : function(context) {
        console.log("handleViewContext",context);

        var currentView = this.getCurrentView();
        $('span.viewContext').append('<em>'+currentView+"</em>");

        /*** HANDLE GADGET PARAMS ***/
        var gadgetParams = gadgets.views.getParams();
        if (gadgetParams) {
          $('#paramsContext').html('<pre>'+JSON.stringify(gadgetParams,null,2)+"</pre>");
        } else {
          $('#paramsContext').html('No Params Found');
        }// end if

        if (context) {
          $("#currentViewContext").html("<p><strong>Raw Context</strong></p>");
          $("#currentViewContext").append("<pre>"+JSON.stringify(context,null,2)+"</pre>");
          osapi.jive.corev3.resolveContext(context,
            function(object) {
              $("#currentViewContext").append("<hr/><p><strong>After Resolve</strong></p><pre>"+JSON.stringify(object["content"],null,2)+"</pre>");
              gadgets.window.adjustHeight();
              gadgets.window.adjustWidth();
          });

        } // end if

        /*** ADD IN A BUTTON ***/
        if (currentView == 'rte-action') {
            /**** EXAMPLE LOADING CONTEXT DATA FOR !APP VIEW ****/
            opensocial.data.getDataContext().registerListener('org.opensocial.ee.context',
                function (key) {
                   var data = opensocial.data.getDataContext().getDataSet(key);
                   console.log("getDataContext",data);
                   $("#currentActionContext").html("<p><strong>Raw Context</strong></p>");
                   $("#currentActionContext").append("<pre>"+JSON.stringify(data,null,2)+"</pre>");
                } // end function
            );
        } // end if
        gadgets.window.adjustHeight();
        gadgets.window.adjustWidth();

    }, // end handleViewContext

    /*************************************************************************************
     * EXAMPLE GET CONTEXT FOR ACTION LINKS
     * NOTE:  YOU MUST INCLUDE THE coreapi-context-resolver-v3.js FILE FOR THIS TO WORK
     *************************************************************************************/
    handleActionContext : function(action,context) {
        console.log("handleActionContext",context,action);
        if (context) {
          $('span.actionContext').append('<em>'+action+"</em>");
          $("#currentActionContext").html("<p><strong>Raw Context</strong></p>");
          $("#currentActionContext").append("<pre>"+JSON.stringify(context,null,2)+"</pre>");

          /*** PREVENT FROM FIRING ON !APP SINCE THERE IS NO CONTEXT YET ***/
          if (action != 'example.app.rte.action') {
              osapi.jive.corev3.resolveContext(context,
                function(object) {
                  $("#currentActionContext").append("<hr/><p><strong>After Resolve</strong></p><pre>"+JSON.stringify(object["content"],null,2)+"</pre>");
                  gadgets.window.adjustHeight();
                  gadgets.window.adjustWidth();
              });
          } else {
              /*** CONVENIENT PLACE TO PUT CODE TO RENDER THE "SAVE" BUTTON ***/
              $('#btnEmbedApp').click(gadgets.util.makeClosure(app, app.embedAppReferenceSimple));
              $('#btnEmbedAppProg').click(gadgets.util.makeClosure(app, app.embedAppReferenceProg));
              $('#btnEmbedMarkup').click(gadgets.util.makeClosure(app, app.embedMarkUp));
              $('#embed-actions').show();
          } // end if

          gadgets.window.adjustHeight();
          gadgets.window.adjustWidth();
        } // end if
    }, // end handleActionContext

    handleViewer : function(viewer) {
        console.log("handleViewer",viewer);
        $("#currentUser").html("<pre>"+JSON.stringify(viewer,null,2)+"</pre>");
    }, // end handleViewer

    /*** SEE: https://community.jivesoftware.com/docs/DOC-66636 FOR MORE DETAILS ***/
    /*** SEE: https://github.com/jivesoftware/jive-sdk/blob/6ba453332d3e6feab694e718e4e74f48314911e4/jive-sdk-service/generator/examples/example-sampleapps/apps/rtejsondropper/public/javascripts/main.js ***/
    embedMarkUp : function() {
      var html = '<p align="center"><img src="/api/core/v3/people/1/avatar" /><br/>Example HTML Embedded from !app.  Output is a simple HTML string.  The string can be static or even a composite of API data concatenated and then INSERTED</p>';
      osapi.jive.core.container.editor().insert(html);
    },

    /*** SEE: https://community.jivesoftware.com/docs/DOC-66636 FOR MORE DETAILS ***/
    embedAppReferenceProg : function() {
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
      }, // end embedAppReferenceProg

      /*** SEE: https://community.jivesoftware.com/docs/DOC-66636 FOR MORE DETAILS ***/
      embedAppReferenceSimple : function() {
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

};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));
