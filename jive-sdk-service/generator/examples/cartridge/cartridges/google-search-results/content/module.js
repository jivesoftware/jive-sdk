/* Google Search Results module for Jive Anywhere

   ModuleContext, JCommon and $ are provided by the module manager
   Recommended URL filter: www.google.com
*/

this.minimumRequiredVersion = 2.1;

this.init = function () {
   // Compile markup as named templates to be used by onGetPreviewData later
   var html = ModuleContext.getResourceFile('GoogleSearchResultsPageDataTemplate.html');
   $.templates({
      googleSearchResultsPageDataTemplate : html
   });
};

// Display the defect ID of the site in the community tab
this.onGetModuleUI = function (callback) {
    var moduleUiInfo = { defaultTabId: 0, tabs: [{ title: "Google Search Results" }, {}] };
    callback(moduleUiInfo);
};


// Generates preview data when submitting a new discussion instead of the default OpenGraph
this.onGetPreviewData = function (openGraphMetadata, isFinal, customValues, callback) {

   // Extracting page data by invoking a page helper function on pagescript.js
   ModuleContext.runPageScript("getPreviewData", null, function (pageData) {
   
      // Use the LinkedInPageDataTemplate.html template to generate html markup
      var html = $.render.googleSearchResultsPageDataTemplate(pageData);

      // Pass the html back to the module manager
      callback(html);
   });
};

//// Normalizes the URL to include the search term
//this.onGetNormalizedSearchUrl = function(url) {
//	console.log(url);
//	return document.location.href;
//};
