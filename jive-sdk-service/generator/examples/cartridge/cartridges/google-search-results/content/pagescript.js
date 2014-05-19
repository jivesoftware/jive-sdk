/* Google Search Results cartridge for Jive Anywhere (page content script)

   PageModuleContext, JCommon and $ are provided by the module manager
*/

this.getPreviewData = function (params, sendResponse) {
    var data = new Object();
    	
    data.url = document.location.href;
    data.searchTimestamp = new Date().toString();
    data.searchTerm = document.title.substring(0,(document.title.indexOf(' - ')));
    data.results = [];
    
    /*** LOAD RESULTS ***/
    $('li.g').each(function() {
    	var result = {};
    	result.title = $(this).find('h3.r a').text();
    	result.url = $(this).find('h3.r a').attr('href');
    	result.description = $(this).find('span.st').text();
    	
    	if (result.title && result.url) {
			data.results.push(result);
		} // end if
    });
    
    sendResponse(data);
};