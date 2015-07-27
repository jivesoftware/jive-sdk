var app = {

    jiveURL : opensocial.getEnvironment()['jiveUrl'],
    
	init : function() {
		//** LOAD CURRENT VIEW ***
		var currentView = gadgets.views.getCurrentView().getName();
		
		/*** LOAD CONTEXT ***/
		osapi.jive.core.container.getLaunchContext(handleContext);
		
	}, // end init

	handleContext : function(ctx) {
		var appObj = this;
		$("#output").html('<pre>'+ctx.jive.context.body+'</pre>');  
	} // end handleContext
};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));