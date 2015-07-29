var app = {

    jiveURL : opensocial.getEnvironment()['jiveUrl'],
    
    currentView : null,
    
	init : function() {
		//** LOAD CURRENT VIEW ***
		this.currentView = gadgets.views.getCurrentView().getName();
		
		/*** LOAD CONTEXT ***/
		osapi.jive.core.container.getLaunchContext(this.handleContext);
		
	}, // end init

	handleContext : function(ctx) {
		var appObj = this;
		$("#output").html('<pre>'+JSON.stringify(ctx, null, '\t')+'</pre>');  
		gadgets.window.adjustHeight();
	} // end handleContext
};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));