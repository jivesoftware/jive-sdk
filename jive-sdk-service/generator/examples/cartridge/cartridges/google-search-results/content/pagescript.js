/* Google Search Results cartridge for Jive Anywhere (page content script)

   PageModuleContext, JCommon and $ are provided by the module manager
*/

this.getPreviewData = function (params, sendResponse) {
    var data = new Object();
    	
    data.url = document.location.href;
//  console.log(data.url);
    data.searchTimestamp = new Date().toString();
//	console.log(data.searchTimestamp);
    data.searchTerm = document.title.substring(0,(document.title.indexOf(' - ')));
//	console.log(data.searchTerm);
    data.results = [];
    
    /*** LOAD RESULTS ***/
    $('li.g').each(function() {
    	var result = {};
//		console.log('1');
    	result.title = $(this).find('h3.r a').text();
//		console.log('2');
    	result.url = $(this).find('h3.r a').attr('href');
//		console.log('3');
    	result.description = $(this).find('span.st').text();
//		console.log('4');
    	
		data.results.push(result);
    });
    
//	console.log('getPreviewData complete');
    sendResponse(data);
};

