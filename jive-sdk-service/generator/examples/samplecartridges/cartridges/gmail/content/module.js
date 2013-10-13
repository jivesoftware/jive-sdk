/* Gmail module for Jive Anywhere

   ModuleContext, JCommon and $ are provided by the module manager
   Recommended URL filter: mail.google.com/mail

   Requires Jive Anywhere 2.1 and EAPIs v3
*/

var _convertedDiscussions = []; // array of existing converted discussions for the current email
var _viewType = "global";
var _emailSubject;

this.minimumRequiredVersion = 2.1;

this.init = function () {
    if (ModuleContext.version >= 2.1) {
        // fetch email data from each community
        JCommon.asyncRunForArray(ModuleContext.connectionContexts.connections, function (context, submitResultCallback) {
            // we must call getSettings() on each connectionContext before accessing its clientFacade
            context.getSettings(function (settings) {
                if (context.clientFacade.version >= 3) {
                    submitResultCallback({ serverUrl: settings.connectionSettings.serverUrl, emailServer: settings.serverSettings.emailServer, emailPrefix: settings.serverSettings.emailPrefix });
                }
                else {
                    // compatibility for EAPIs v2.1
                    context.clientFacade.getOfficeSystemInfo(function (systeminfo) {
                        submitResultCallback({ serverUrl: settings.connectionSettings.serverUrl, emailServer: systeminfo.emailServer, emailPrefix: systeminfo.emailPrefix });
                    });
                }
            });
        }, function (results) {
            // this callback runs after all requests completed
            var profileTemplate = ModuleContext.getResourceFile("ProfileUiTemplate.html");
            var css = ModuleContext.getResourceFile("page.css");
            ModuleContext.runPageScript("init", { connections: results, css: css, profileTemplate: profileTemplate });
        });

        // Compile markup as named templates
        var sidebarTemplate = ModuleContext.getResourceFile("SidebarUiTemplate.html");

        $.templates({
            gmailSidebarTemplate: sidebarTemplate
        });
    }
};

this.onGetNotificationUI = function (isSiteInWhitelist, callback) {
    callback({ autoHide: true, highlight: false });
};

this.onGetModuleUI = function (callback) {
    // inject SidebarUiTemplate.html into the sidebar  
    var communityName = ModuleContext.connectionContexts.activeConnection.getConnectionSettings().instanceName;
    var convertedDiscussionForCommunity = _convertedDiscussions[ModuleContext.connectionContexts.activeConnection.index];
    var activeConnectionBackwardCompatible = ModuleContext.connectionContexts.activeConnection.clientFacade.version < 3;
    var htmlDiscussions = $.render.gmailSidebarTemplate({ viewType: _viewType, communityName: communityName, activeConnectionBackwardCompatible: activeConnectionBackwardCompatible, convertedDiscussions: convertedDiscussionForCommunity ? convertedDiscussionForCommunity.urls : [] });
    var htmlRelated = $.render.gmailSidebarTemplate({ viewType: "relatedContainers" });

    var customCheckboxs = [
        { name: "notifyExternalUsers", checked: false, text: "Notify external participants" },
        { name: "uploadImages", checked: true, text: "Upload embedded images" },
        { name: "uploadAttachments", checked: false, text: "Upload file attachments" }];

    if (!JCommon.isBinarySupported || ModuleContext.connectionContexts.activeConnection.clientFacade.version < 3) {
        // removes upload images/attachment options if not supported by the browser
        customCheckboxs.length = 1;
    }

    var moduleUiInfo = { defaultTabId: 0, defaultTitle: _emailSubject, hideSnapshots: true, newDiscussionCustomCheckboxes: customCheckboxs, postButtonText: "Convert", tabs: [{ html: htmlDiscussions, hideDefaultUi: true, hideFilters: true }, { html: htmlRelated, hideDefaultUi: true, hideFilters: true }] };

    callback(moduleUiInfo);
};

this.onGetRelatedContainerTag = function () {
    // return empty string to avoid a request to Jive for taking the connected containers and the list of discussions for the container
    return "";
};

this.onGetUrlSearchResults = function (searchData, callback) {
    var conn = ModuleContext.connectionContexts.activeConnection;
    var results = _convertedDiscussions[conn.index];

    if (results && results.response) {
        // we have previously found the results for this context and we're running in EAPIs v3, so let's show the converted discussions in the sidebar
        callback(results.response);
    }
    else {
        // just return empty results
        callback({ items: [] });
    }
};

this.onGetPreviewData = function (openGraphMetadata, isFinal, customValues, callback) {
    // disable openGraph or other preview data into converted messages
    callback("");
};

this.onMessage = function (command, data, sendResponse) {
    switch (command) {
        case "initItem":
            // check existing converted discussions based on message-id
            var convertedDiscussionInfo = { length: 0, connections: [] };
            _convertedDiscussions = [];
            _emailSubject = null;

            if (data.isGlobalView) {
                // not an email or discussion, just clear sidebar results
                _viewType = "global";
                ModuleContext.reloadSidebar();
            }
            else if (data.isDiscussion) {
                // we're viewing a discussion
                _viewType = "discussion";
                ModuleContext.reloadSidebar();
            }
            else {
                // we're viewing an email
                _viewType = "email";
                _emailSubject = data.subject;

                if (data.messageId) {
                    // search for a discussion matching the messageId
                    JCommon.asyncRunForArray(ModuleContext.connectionContexts.connections, function (context, submitResultCallback) {
                        context.clientFacade.getConvertedDiscussions(data.messageId, function (result) {
                            // build (and keep) the url for each discussion found
                            var urls = [];
                            var connectionSettings = context.getConnectionSettings();

                            if (context.clientFacade.version >= 3) {
                                if (result.items) {
                                    result.items.reverse();
                                    for (var i = 0; i < result.items.length; i++) {
                                        urls.push(result.items[i].url);
                                        convertedDiscussionInfo
                                        convertedDiscussionInfo.length++;
                                    }
                                }
                                // for v3 we keep the response as well, we use it later for onGerUrlSearchResults
                                submitResultCallback({ response: result, urls: urls, instanceName: connectionSettings.instanceName, serverUrl: connectionSettings.serverUrl });
                            }
                            else {
                                // compatibility for EAPIs v2.1                                
                                for (var i = 0; i < result.length; i++) {
                                    var url = connectionSettings.serverUrl + "/thread/" + result[i].id;
                                    urls.push(url);
                                    convertedDiscussionInfo.length++;
                                }
                                // just keep the urls
                                submitResultCallback({ urls: urls, instanceName: connectionSettings.instanceName, serverUrl: connectionSettings.serverUrl });
                            }
                        });
                    }, function (arr) {
                        // this callback runs after all requests completed
                        _convertedDiscussions = arr;

                        for (var i = 0; i < arr.length; i++) {
                            convertedDiscussionInfo.connections.push({ instanceName: arr[i].instanceName, serverUrl: arr[i].serverUrl, length: arr[i].urls.length });
                        }
                        
                        // clear old sidebar discussions and load converted discussions (based on messageId)
                        ModuleContext.reloadSidebar();

                        // let the page update its UI
                        sendResponse(convertedDiscussionInfo);
                    });
                }
                else {
                    // messageId is not available
                    ModuleContext.reloadSidebar();
                    sendResponse(convertedDiscussionInfo);
                }
            }
            break;
        case "uploadImage":
            // download image as binary
            var conn = ModuleContext.connectionContexts.activeConnection;

            JCommon.getBinaryFile(data, function (jFile) {
                if (jFile) {
                    // upload a new image to Jive and send the response back
                    conn.clientFacade.uploadImage(jFile, sendResponse)
                }
                else {
                    // failed to download
                    sendResponse(null);
                }
            });
            break;
        case "getUserById":
            // search user by id in the community of the discussion (for discussion view)
            var conn = ModuleContext.connectionContexts.connections[data.serverUrl];
            conn.clientFacade.getUserById(data.id, function (user) {
                var connectionSettings = conn.getConnectionSettings();
                user.profileImageUrl = JCommon.getProfileImageUri(user.id, 72, connectionSettings.serverUrl, connectionSettings.embeddedAuthToken);
                user.instanceName = connectionSettings.instanceName;

                sendResponse(user);
            });
            break;
        case "searchUserByEmail":
            // search user by email in all communities (for regular email)
            JCommon.asyncRunForArray(ModuleContext.connectionContexts.connections, function (context, submitResultCallback) {
                context.clientFacade.getUserByEmail(data.email, function (user) {
                    submitResultCallback(user);
                });
            }, function (users) {
                // this callback runs after all requests completed
                // take the first user found in the order of the communities we have
                for (var i = 0; i < users.length; i++) {
                    var user = users[i];
                    if (!user.isError && user.code != 4003) {
                        var connectionSettings = ModuleContext.connectionContexts.connections[i].getConnectionSettings();
                        user.profileImageUrl = JCommon.getProfileImageUri(user.id, 72, connectionSettings.serverUrl, connectionSettings.embeddedAuthToken);
                        user.instanceName = connectionSettings.instanceName;

                        sendResponse(user);
                        return;
                    }
                }

                // we've reached here but no user was found
                sendResponse(null);
            });
            break;
    }
};

this.onCreateDiscussion = function (discussion, isPublic, callbackCompleted, uploadProgressCallback) {
    // convert email messages into a new discussion
    var conn = ModuleContext.connectionContexts.activeConnection;
    var progressDict = {};

    if (discussion.customValues.uploadImages) {
        // show the progress bar
        uploadProgressCallback(0);
    }

    ModuleContext.runPageScript("getConversation", discussion.customValues, function (result) {
        if (result) {
            var messages = result.messages;

            if (messages.length > 0) {
                // prepare file attachments
                JCommon.asyncRunForArray(result.attachments, function (attachment, submitResultCallback) {
                    if (result.uploadAttachments) {
                        // download attachment as binary
                        JCommon.getBinaryFile(attachment.src, function (jFile) {
                            if (jFile) {
                                // add filename to the message at the correct index
                                messages[attachment.messageIndex].attachmentUris.push(jFile.filename);
                                submitResultCallback(jFile);
                            }
                            else {
                                // attachment download failed, add an error to the message's body
                                var error = $("<div />").text("<file attachment was not included in the discussion due to an error>");
                                messages[attachment.messageIndex].body += JCommon.getNodeSource(error[0]);
                                submitResultCallback(null);
                            }
                        }, function (downloadProgress) {
                            progressDict[attachment.src] = downloadProgress;
                            uploadProgressCallback(getComulativeProgress(progressDict).progress / 2);
                        });
                    }
                    else {
                        // add placeholders in case attachment uploads disabled
                        var error = $("<div />").text("<file attachment was not included in the discussion>");
                        messages[attachment.messageIndex].body += JCommon.getNodeSource(error[0]);
                        submitResultCallback(null);
                    }
                }, function (attachmentFiles) {
                    // called after attachmnet download completed
                    conn.clientFacade.getConnectedUser(function (user) {
                        // create our own comment we just entered in the new discussion dialogue
                        var title = discussion.subject;
                        var message = {};
                        message.body = discussion.content;
                        message.subject = title;
                        message.sender = user.emailAddress;
                        message.senderName = user.displayName;
                        message.attachmentUris = [];
                        messages.push(message);

                        // processing emails in the discussion
                        var emails = [];
                        for (var j = 0; j < messages.length; j++) {
                            messages[j].subject = title;
                            messages[j].body = "<body>" + messages[j].body + "</body>";
                            // add the email reciept if it's not already in the array
                            if ($.inArray(messages[j].sender, emails) == -1) {
                                emails.push(messages[j].sender);
                            }
                        }

                        var data = {};
                        data.question = discussion.isQuestion;
                        data.notificationRecipients = emails;
                        data.messages = messages;

                        createConvertedDiscussion(isPublic, conn, result.messageId, data, discussion, attachmentFiles, function (response) {
                            if (!response.isError) {
                                // update converted discussion objects
                                _convertedDiscussions[conn.index].urls.push(response.url);
                                // update the sidebar list
                                if (conn.clientFacade.version >= 3) {
                                    conn.clientFacade.getConvertedDiscussions(result.messageId, function (convertedDiscussionsResult) {
                                        convertedDiscussionsResult.items.reverse();
                                        _convertedDiscussions[conn.index].response = convertedDiscussionsResult;
                                        // close the new discussion dialogue and add the new discussion to the list
                                        callbackCompleted(convertedDiscussionsResult.items[0]);
                                    });
                                }
                                else {
                                    // close the new discussion dialogue
                                    callbackCompleted(null);
                                    ModuleContext.reloadSidebar();
                                }

                                // tell pagescript.js to update the contacts panel
                                ModuleContext.runPageScript("discussionConvertCompleted", conn.index);
                            }
                            else {
                                // show the error
                                callbackCompleted(response);
                            }
                        }, function (uploadProgress) {
                            // update progress bar
                            var downloaded = getComulativeProgress(progressDict).progress;
                            var uploaded = (uploadProgress.loaded / uploadProgress.total);
                            uploadProgressCallback((downloaded + uploaded) / 2);
                        });
                    });
                });
            }
        }
        else {
            // show an error in the dialogue
            callbackCompleted({ isError: true, message: "You must first select an email to convert" });
        }
    });
};

// ------------------------------------------------ Helper functions -------------------------------------

function createConvertedDiscussion(isPublic, conn, messageId, data, discussion, attachmentFiles, callbackCompleted, uploadProgressCallback) {
    if (isPublic) {
        conn.clientFacade.createPublicConvertedDiscussion(data, discussion.containerType, discussion.containerId, messageId, discussion.customValues.notifyExternalUsers, attachmentFiles, callbackCompleted, uploadProgressCallback);
    }
    else {
        conn.clientFacade.createPrivateConvertedDiscussion(data, discussion.userIds, messageId, discussion.customValues.notifyExternalUsers, attachmentFiles, callbackCompleted, uploadProgressCallback);
    }
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
