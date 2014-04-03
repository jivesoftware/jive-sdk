/* Google Drive module for Jive Anywhere

   ModuleContext, JCommon and $ are provided by the module manager
   Recommended URL filter: drive.google.com

   Requires Jive Anywhere 2.1 and EAPIs v3
*/

this.getSelectedFileUrls = function (params, sendResponse) {
    // send the list of URLs back to background context
    sendResponse(getDownloadUrls(params, true));
};

function getDownloadUrls(asPdf, selectedOnly) {
    // get all selected file elements
    var selector = '.doclist-tr-selected a.doclist-content-wrapper[href]:visible';
    if (!selectedOnly) {
        // add non-selected file elements
        selector += ', .doclist-tr a.doclist-content-wrapper[href]:visible'
    }

    var elems = $(selector);
    var urls = [];

    // build the URL for each selected file
    elems.each(function () {
        var elem = $(this);
        var href = elem.attr("href");
        var id = elem.attr("id");
        var src;
        id = id.substring(id.indexOf(".dnl.") + 5);
        
        if (href.indexOf("/file/d/") > -1) {
            // regular file
            src = JCommon.getNonRelativeUrl("/uc?id=" + encodeURIComponent(id) + "&export=download");
        }
        else if (href.indexOf("docs.google.com/document") > -1) {
            // google document
            if (asPdf) {
                src = "https://docs.google.com/document/d/" + encodeURIComponent(id) + "/export?format=pdf";
            }
            else {
                // docx
                src = "https://docs.google.com/document/d/" + encodeURIComponent(id) + "/export?format=docx";
            }
        }
        else if (href.indexOf("docs.google.com/spreadsheet") > -1) {
            // google spreadsheet
            if (asPdf) {
                src = "https://docs.google.com/spreadsheet/fm?key=" + encodeURIComponent(id) + "&fmcmd=12";
            }
            else {
                // xlsx
                src = "https://docs.google.com/spreadsheet/fm?key=" + encodeURIComponent(id) + "&fmcmd=420";
            }
        }
        else if (href.indexOf("docs.google.com/presentation") > -1) {
            // google presentation
            if (asPdf) {
                src = "https://docs.google.com/presentation/d/" + encodeURIComponent(id) + "/export/pdf";
            }
            else {
                // pptx
                src = "https://docs.google.com/presentation/d/" + encodeURIComponent(id) + "/export/pptx";
            }
        }
        else if (href.indexOf("docs.google.com/drawings") > -1) {
            // google drawings
            if (asPdf) {
                src = "https://docs.google.com/drawings/d/" + encodeURIComponent(id) + "/export/pdf";
            }
            else {
                // svg
                src = "https://docs.google.com/drawings/d/" + encodeURIComponent(id) + "/export/svg";
            }
        }

        if (src) {
            urls.push(src);
        }
    });

    return urls;
}

function registerCheckboxEvents() {
    // select/unselect-all click event (the click event is not bubbled for this element so we use mousedown as an alternative)
    $(document).on("mousedown", ".selectioncomponent .jfk-checkbox", function () {
        if ($(this).hasClass("jfk-checkbox-unchecked")) {
            // about to select all checkboxes
            PageModuleContext.sendMessage("updateNewDiscussionCheckboxs", getDownloadUrls(true, false));
        }
        else {
            // about to clear all checkboxes
            PageModuleContext.sendMessage("updateNewDiscussionCheckboxs", []);
        }
    });

    // item checkbox click event
    $(document).on("click", ".doclist-td-checkbox, .doclist-td-name", function () {
        PageModuleContext.sendMessage("updateNewDiscussionCheckboxs", getDownloadUrls(true, true));
    });

    // keyboard press event
    $(document).on("keyup", function (event) {
        if (event.keyCode == 88) {
            // x clicked
            PageModuleContext.sendMessage("updateNewDiscussionCheckboxs", getDownloadUrls(true, true));
        }
    });

    // url  navigation event
    $(window).on("hashchange", function () {
        PageModuleContext.sendMessage("updateNewDiscussionCheckboxs", []);
    });
}

registerCheckboxEvents();