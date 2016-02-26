var app = {

    jiveURL : opensocial.getEnvironment()['jiveUrl'],

    getCurrentView : function() {
      var currentView = location.href.substr(location.href.indexOf('view=')+'view='.length);
      if (currentView) {
        currentView = currentView.substr(0,currentView.indexOf('&'));
      } // end if
      return (!currentView) ? '' : currentView;
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

      // resize app window to fit content
      gadgets.window.adjustHeight();
      gadgets.window.adjustWidth();

    },

    /*** EXAMPLE GET CONTEXT FOR APP VIEWS ****/
    handleViewContext : function(context) {
        console.log("handleViewContext",context);
        $('span.viewContext').append('&nbsp;&nbsp;<em>'+this.getCurrentView()+"</em>");
        if (context) {
          $("#currentViewContext").html("<p><strong>Raw Context</strong></p>");
          $("#currentViewContext").append("<pre>"+JSON.stringify(context,null,2)+"</pre>");
          osapi.jive.corev3.resolveContext(context,
            function(object) {
              $("#currentViewContext").append("<hr/><p><strong>After Resolve</strong></p><pre>"+JSON.stringify(object["content"],null,2)+"</pre>");
              gadgets.window.adjustHeight();
              gadgets.window.adjustWidth();
          });
          gadgets.window.adjustHeight();
          gadgets.window.adjustWidth();
        } // end if
    }, // end handleViewContext

    /*************************************************************************************
     * EXAMPLE GET CONTEXT FOR ACTION LINKS
     * NOTE:  YOU MUST INCLUDE THE coreapi-context-resolver-v3.js FILE FOR THIS TO WORK
     *************************************************************************************/
    handleActionContext : function(action,context) {
        console.log("handleActionContext",context,action);
        if (context) {
          $('span.actionContext').append('&nbsp;&nbsp;<em>'+action+"</em>");
          $("#currentActionContext").html("<p><strong>Raw Context</strong></p>");
          $("#currentActionContext").append("<pre>"+JSON.stringify(context,null,2)+"</pre>");
          osapi.jive.corev3.resolveContext(context,
            function(object) {
              $("#currentActionContext").append("<hr/><p><strong>After Resolve</strong></p><pre>"+JSON.stringify(object["content"],null,2)+"</pre>");
              gadgets.window.adjustHeight();
              gadgets.window.adjustWidth();
          });
          gadgets.window.adjustHeight();
          gadgets.window.adjustWidth();
        } // end if
    }, // end handleActionContext

    handleViewer : function(viewer) {
        console.log("handleViewer",viewer);
        $("#currentUser").html("<pre>"+JSON.stringify(viewer,null,2)+"</pre>");
    } // end handleViewer

};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));
