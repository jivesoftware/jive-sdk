/* LinkedIn module for Jive Anywhere

   ModuleContext, JCommon and $ are provided by the module manager
   Recommended URL filter: linkedin.com 
*/

this.minimumRequiredVersion = 2.1;

this.init = function () {
    // prepare preview template, compile markup as named templates
    var pageDataTemplate = ModuleContext.getResourceFile("LinkedInPageDataTemplate.html");

    $.templates({
        linkedInPageDataTemplate: pageDataTemplate
    });
};

this.onGetUrlSearchResults = function (searchData, callback) {
    // invoked when community search occurs
    // extract the visited profile from page title
    var userName = extractUserName();

    if (userName != null) {
        // search results by quering profile name
        var query = "\"" + userName + "\"";
        ModuleContext.connectionContexts.activeConnection.clientFacade.search(query, searchData.offset, searchData.limit, searchData.sortBy, searchData.isAscending, callback);
    }
    else {
        // just run normal search
        callback(null);
    }
};

this.onGetModuleUI = function (callback) {
    // change the title of the community tab to visited profile name
    var moduleUiInfo = { defaultTabId: 0, tabs: [{ title: extractUserName() }, {}] };
    callback(moduleUiInfo);
};

this.onGetPreviewData = function (openGraphMetadata, isFinal, customValues, callback) {
    // extract profile fields by invoking getPreviewData() on pagescript.js
    ModuleContext.runPageScript("getPreviewData", null, function (pageData) {
        // render preview template using extracted data and predefined LinkedInPageDataTemplate.html
        var html = $.render.linkedInPageDataTemplate(pageData);
        callback(html);
    });
};

// ------------------------- Helpers -------------------------

var extractUserName = function () {
    // extract the visited profile from page title
    var title = ModuleContext.pageInfo.title;
    var index = title.indexOf("| LinkedIn");
    if (index > -1) {
        return $.trim(title.substring(0, index));
    }

    return null;
};
