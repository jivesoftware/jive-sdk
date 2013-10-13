/* JIRA module for Jive Anywhere (page content script)

   PageModuleContext, JCommon and $ are provided by the module manager
*/

this.getPreviewData = function (params, sendResponse) {
    var issue = new Object();

    issue.url = document.location.href;
    issue.defectTitle = $("#summary-val").text();
    issue.projectUrl = JCommon.getNonRelativeUrl($("#project-name-val").attr("href"));
    issue.projectName = $("#project-name-val").text();
    issue.defectId = $("#key-val").text();
    issue.defectType = $("#type-val").text();
    issue.status = $("#status-val").text();
    issue.priority = $("#priority-val").text();
    issue.resolution = $("#resolution-val").text();

    sendResponse(issue);
};

