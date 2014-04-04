/* LinkedIn module for Jive Anywhere

   ModuleContext, JCommon and $ are provided by the module manager
   Recommended URL filter: linkedin.com 
*/

this.minimumRequiredVersion = 2.1;

this.init = function () {
    // tells pagescript.js to inject hooks required for monitoring the user popup
    ModuleContext.runPageScript("init", null);

    // compile markup as named templates
    var pageDataTemplate = ModuleContext.getResourceFile("LinkedInPageDataTemplate.html");

    $.templates({
        linkedInPageDataTemplate: pageDataTemplate
    });
};

this.onMessage = function (command, data, sendResponse) {
    if (command == "getProfile") {
        // reveived a getProfile message from pagescript.js, search for a user matching link name
        ModuleContext.connectionContexts.activeConnection.clientFacade.searchUsers(data, 1, function (result) {
            if (result.people && result.people.length == 1) {
                // one user found, get the user id
                var userId = result.people[0].id;
                // request full profile
                ModuleContext.connectionContexts.activeConnection.clientFacade.getUserById(userId, function (user) {
                    // render the template of the Jive section and return its html
                    var html = $.render.linkedInPageDataTemplate(user);
                    sendResponse(html);
                });
            }
            else {
                // user not found, render the template with empty data and return its html
                var html = $.render.linkedInPageDataTemplate({ isError: result.isError, message: result.message });
                sendResponse(html);
            }
        });
    }
};