gadgets.util.registerOnLoadHandler(function() {


	$("#adjustWidth").click( function() { 
	  	gadgets.window.adjustWidth();
	});

	$("#adjustHeight").click( function() { 
	  	gadgets.window.adjustHeight();
	});

	$("#adjustBoth").click( function() { 
	  	gadgets.window.adjustWidth();
	  	gadgets.window.adjustHeight();
	});

});
