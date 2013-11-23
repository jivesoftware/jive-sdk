/* Google Drive module for Jive Anywhere

   ModuleContext, JCommon and $ are provided by the module manager
   Recommended URL filter: drive.google.com

   Requires Jive Anywhere 2.1 and EAPIs v3
*/

this.minimumRequiredVersion = 2.1;

this.init = function () {
    // Compile markup as named templates
    var sidebarTemplate = ModuleContext.getResourceFile("SidebarUiTemplate.html");

    $.templates({
        googleDriveSidebarTemplate: sidebarTemplate
    });
}

this.onMessage = function (command, data, sendResponse) {
    switch (command) {
        case "updateNewDiscussionCheckboxs":
            // a file has been checked or unchecked, update the checkbox in the new discussion dialogue
            if (ModuleContext.connectionContexts.activeConnection.clientFacade.version >= 3 && JCommon.isBinarySupported) {
                ModuleContext.updateNewDiscussionCheckboxs(getCustomCheckboxes(data.length));
            }
            break;
    }
};

this.onGetNotificationUI = function (isSiteInWhitelist, callback) {
    callback({ autoHide: false, highlight: true });
};

this.onGetModuleUI = function (callback) {
    var htmlRelated = $.render.googleDriveSidebarTemplate({ viewType: "relatedContainers" });

    if (ModuleContext.connectionContexts.activeConnection.clientFacade.version >= 3 && JCommon.isBinarySupported) {
        ModuleContext.runPageScript("getSelectedFileUrls", null, function (urls) {
            // adds a custom checkbox in the new discussion dialogue of Jive Anywhere
            var htmlDiscussions = $.render.googleDriveSidebarTemplate({ viewType: "discussions" });
            var moduleUiInfo = { defaultTitle: "", newDiscussionCustomCheckboxes: getCustomCheckboxes(urls.length), hideSnapshots: true, postButtonText: "Upload", tabs: [{ html: htmlDiscussions, hideDefaultUi: true }, { html: htmlRelated, hideDefaultUi: true }] };
            callback(moduleUiInfo);
        });
    }
    else {
        // cartridge is not supported by this browser or server
        var htmlNotSupported = $.render.googleDriveSidebarTemplate({ viewType: "notSupported" });
        callback({ defaultTitle: "", hideSnapshots: true, tabs: [{ html: htmlNotSupported, hideDefaultUi: true }, { html: htmlRelated, hideDefaultUi: true }] });
    }
};

this.onGetRelatedContainerTag = function () {
    // return empty string to avoid a request to Jive for taking the connected containers and the list of discussions for the container
    return "";
};

this.onGetNormalizedSearchUrl = function (url) {
    // ignore deep urls of the web app
    return "https://drive.google.com/";
};

this.onGetPreviewData = function (openGraphMetadata, isFinal, customValues, callback) {
    // disable openGraph or other preview data into converted messages
    callback("");
};

this.onCreateDiscussion = function (discussion, isPublic, callbackCompleted, uploadProgressCallback) {
    var conn = ModuleContext.connectionContexts.activeConnection;
    var progressDict = {};

    var createCompleteCallback = function (result) {
        if (!result.isError && discussion.customValues.uploadAttachments) {
            // get an array of download URLs of selected file from the page context
            ModuleContext.runPageScript("getSelectedFileUrls", discussion.customValues.exportPdf, function (urls) {
                // perform async requests with final callback
                JCommon.asyncRunForArray(urls, function (url, submitResultCallback) {
                    // download each file
                    JCommon.getBinaryFile(url, submitResultCallback, function (downloadProgress) {
                        progressDict[url] = downloadProgress;
                        uploadProgressCallback(getComulativeProgress(progressDict).progress / 2);
                    });
                }, function (jFilesArr) {
                    // completed downloading all files
                    var onUploadProgress = function (uploadProgress) {
                        var downloaded = getComulativeProgress(progressDict).progress;
                        var uploaded = (uploadProgress.loaded / uploadProgress.total);
                        uploadProgressCallback((downloaded + uploaded) / 2);
                    };

                    var onUploadComplete = function (attachResult) {
                        callbackCompleted(attachResult.isError ? attachResult : result);
                    };

                    if (result.typeId == 2) {
                        // message type, use id
                        conn.clientFacade.uploadAttachmentsToMessage(result.id, jFilesArr, onUploadComplete, onUploadProgress);
                    }
                    else {
                        // content type, use browseId
                        conn.clientFacade.uploadAttachmentsToContent(result.browseId, jFilesArr, onUploadComplete, onUploadProgress);
                    }
                });
            });
        }
        else {
            // attachments are not supported/required or error occured, just pass the response to the real callback
            callbackCompleted(result);
        }
    };

    // create the discussion using the standard implementation, but set the callback to createCompleteCallback for post processing
    if (isPublic) {
        conn.clientFacade.createPublicDiscussion(discussion.subject, discussion.content, discussion.isQuestion, discussion.containerType, discussion.containerId, createCompleteCallback);
    }
    else {
        conn.clientFacade.createPrivateDiscussion(discussion.subject, discussion.content, discussion.isQuestion, discussion.userIds, createCompleteCallback);
    }
};

function getCustomCheckboxes(length) {
    return [{ name: "uploadAttachments", checked: (length > 0), text: "Upload selected Google Drive files (" + length + ")" },
        { name: "exportPdf", checked: (length > 0), text: "Convert uploaded Google docs files to PDF" }
    ];;
}

function getComulativeProgress(progressDict) {
    var comulative = { total: 0, loaded: 0 };

    for (var key in progressDict) {
        var progress = progressDict[key];
        if (progress.lengthComputable) {
            comulative.total += progress.total;
            comulative.loaded += progress.loaded;
        }
    }

    if (comulative.total > 0) {
        comulative.progress = comulative.loaded / comulative.total;
    }
    else {
        comulative.progress = 0;
    }

    return comulative;
}
