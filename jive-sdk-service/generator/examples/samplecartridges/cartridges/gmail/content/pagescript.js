/* Gmail module for Jive Anywhere (page content script)

   PageModuleContext, JCommon and $ are provided by the module manager
*/

var _originalMessagesCache = {};
var _usersCache = {}; // dictionary of {key: id/email, value: user object}

var _contactPanel;
var _initParams;
var _messageId;

var _view = {};

//------------------------------------------ Public functions -------------------------------------------------

this.init = function (params, sendResponse) {
    // Compile markup as named templates
    $.templates({
        profileTemplate: params.profileTemplate
    });

    // register global UI events
    $(document).on("change", ".jiveAnywhereListContacts", onSelectedContactChanged);
    $(document).on("click", ".jiveConvertDiscussionButton", onConvertButtonClicked);
    $(document).on("click", ".jiveToolbarButton", onToolbarButtonClicked);
    $(document).on("click", ".jiveViewAsDiscussionButton", onViewAsDiscussionButtonClicked);
    $(document).on("click", ".jiveViewAsEmailButton", onViewAsEmailButtonClicked);
    $(document).on("click", ".jiveScrollTopButton", onScrollTopButtonClicked);
    $(document).on("click", ".jiveShowConvertedDiscussionsPopupButton", onShowConvertedDiscussionsPopupButtonClicked);
    $(document).on("click", ".jiveOpenConvertedDiscussionsButton", onOpenConvertedDiscussionsButtonClicked);
    $(document.body).on("click", closePopups);

    // inject CSS into page
    JCommon.addCssText(params.css);
    // called by module.js at the initialization stage
    _initParams = params;
    // listen hash changes event
    setCallbackForItemViewChanged(onHashChange);
    // init when UI is ready
    initOnWebAppReady();
};

this.getConversation = function (params, sendResponse) {
    // called by module.js when convert to discussion is in progress
    if (_messageId && isEmailView()) {
        // get the messages from the DOM
        var imgs = [];
        var attachments = [];
        var messages = getConversationToConvert(imgs, attachments);

        // start by processing images (this is also required if we do not embed images in order to replace them)
        processImages(imgs, params.uploadImages, function () {
            // stringify each body, it must be done only after all processing completed
            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];
                message.body = JCommon.getNodeSource(message.bodyElem[0], true);
                delete message.bodyElem;
            }

            // send all the messages with attachments to module.js
            sendResponse({ messages: messages, messageId: _messageId, attachments: attachments, uploadAttachments: params.uploadAttachments });
        });
    }
    else {
        // fail the conversation, we're not in an email view
        sendResponse(null);
    }
};

this.discussionConvertCompleted = function (params, sendResponse) {
    // called by module.js after conversation completes
    // increase number of converted discussions in view
    _view.convertedDiscussionInfo.connections[params].length++;
    _view.convertedDiscussionInfo.length++;

    renderContactsPanel();
    showToolbarButton(_view.convertedDiscussionInfo.length);
};

// invoked internally due to createDiscussionViewFrame

this.discussionFrameCloseButtonClicked = function (params) {
    // invoked when the close button of jView clicked
    onViewAsEmailButtonClicked();
};

this.discussionFrameScrollTop = function (params) {
    // invoked when a scroll to comment occurs
    setScrollTop(params.top);
};

this.discussionFrameLoaded = function (params) {
    // invoked after the discussion frame has been loaded
    _view.currentUsers = [];

    if (!params.discussion.isError) {
        // get the list of users from the discussion item of the frame and build a new array of {id/name}
        var users = params.discussion.users;

        var contextUserId;

        if (params.typeId == params.discussion.typeId && params.itemId == params.discussion.id) {
            // use the author id of the discusion
            contextUserId = params.discussion.userId;
        }
        else {
            // find the anchor comment
            for (var i = 0; i < params.discussion.comments.length; i++) {
                var comment = params.discussion.comments[i];
                if (params.typeId == comment.typeId && params.itemId == comment.id) {
                    // found the author id for the comment
                    contextUserId = comment.userId;
                    break;
                }
            }
        }

        for (var key in users) {
            var user;
            if (key < 0) {
                // anonnymous user, we'll search by email in other communities
                user = { email: users[key].emailAddress, name: users[key].displayName }
            }
            else {
                // registered user, we'll get by user id from this community
                user = { serverUrl: params.serverUrl, id: key, name: users[key].displayName };
            }

            if (key == contextUserId) {
                // this is the context user, place at 0 index
                _view.currentUsers.unshift(user);
            }
            else {
                // push to the end of the array
                _view.currentUsers.push(user);
            }
        }
    }

    renderContactsPanel();
};

//------------------------------------------ Private functions -------------------------------------------------

function initOnWebAppReady() {
    // check if web app's UI has been initialized yet
    if (isWebAppReady()) {
        onHashChange();
    }
    else {
        // try again later if the commandbar has not been created yet
        setTimeout(initOnWebAppReady, 300);
    }
}

function onHashChange() {
    // main cartridge flow, invoked on init and URL changes
    // remove old jview frame if exists
    $(".jiveEmbeddedFrame").remove();
    // reset fields
    _messageId = null;
    _contactPanel = null;
    _view.selectedUserIndex = 0;
    _view.currentUsers = [];
    _view.convertedDiscussionInfo = { length: 0, connections: [] };

    // check if we're in an email view and get the reply-to address if available    
    if (isEmailView()) {
        // this is an email view
        getCacheItemForCurrentMessage(function (cacheItem) {
            // create an empty contact panel        
            _contactPanel = addContactsPanel();
            // find a community matching this reply address
            var serverUrl = getServerUrlForReplyAddress(cacheItem.replyToAddress);

            if (serverUrl) {
                // create a stand alone jView frame
                var item = JCommon.decodeEmail(cacheItem.replyToAddress);
                var frame = PageModuleContext.createDiscussionViewFrame("jiveAnywhereJview", item.itemType, item.itemId, serverUrl);
                appendJviewFrame(frame);
                _view.isDiscussion = true;
                _view.allowConvert = false;
                _view.isDiscussionView = true;
                PageModuleContext.sendMessage("initItem", { isDiscussion: true });
            }
            else {
                // not a jive reply address, get global message ID
                _messageId = cacheItem.messageId;
                _view.currentUsers = getAllContactsInView();
                _view.isDiscussion = false;
                _view.allowConvert = (_messageId != null && _messageId != undefined);
                _view.isDiscussionView = false;                

                // check if message already converted
                PageModuleContext.sendMessage("initItem", { subject: getEmailSubject(), messageId: _messageId, isDiscussion: false }, function (data) {
                    _view.convertedDiscussionInfo = data;
                    if (_view.allowConvert || _view.convertedDiscussionInfo.length > 0) {
                        // create toolbar button
                        showToolbarButton(_view.convertedDiscussionInfo.length);
                    }
                    if (_view.convertedDiscussionInfo.length > 0) {
                        // render contacts panel again, with # of converted discussions
                        renderContactsPanel();
                    }
                });
            }

            renderContactsPanel();
        });
    }
    else {
        // not an email view, just make sure sidebar clears its discussions
        PageModuleContext.sendMessage("initItem", { isGlobalView: true });
    }
}

function getServerUrlForReplyAddress(replyToAddress) {
    if (replyToAddress) {
        for (var i = 0; i < _initParams.connections.length; i++) {
            var conn = _initParams.connections[i];
            if (conn.emailPrefix && conn.emailServer && replyToAddress.indexOf(conn.emailPrefix + "-") == 0 && replyToAddress.indexOf("@" + conn.emailServer) > -1) {
                // found a match
                return conn.serverUrl;
            }
        }
    }

    // no connection matches the reply address
    return null;
}

function getCacheItemForCurrentMessage(callback) {
    // get the unique message cache id required for managing the cache
    var cacheId = getMessageCacheId();
    var cacheItem = _originalMessagesCache[cacheId];

    // check if the message item is already cached
    if (cacheItem) {
        // found it
        callback(cacheItem);
    }
    else {
        getOriginalMessage(function (originalMessage) {
            // parse the message headers and create a new cache item
            var headers = parseEmailHeaders(originalMessage);

            cacheItem = {
                replyToAddress: headers["REPLY-TO"] ? headers["REPLY-TO"].replace("<", "").replace(">", "") : null,
                messageId: headers["MESSAGE-ID"]
            };

            // keep the cache item in the global collection
            _originalMessagesCache[cacheId] = cacheItem;
            callback(cacheItem);
        });
    }
}

function closePopups() {
    $(".jiveContactPanel .popup").hide();
}

function onConvertButtonClicked() {
    prepareToConvert();
    // open JA sidebar and show new discussion dialogue
    PageModuleContext.showSidebar(true, null);
    return false;
}

function onShowConvertedDiscussionsPopupButtonClicked() {
    var contactContainer = $(this).closest(".jiveContactPanel");

    if ($(".jiveConvertDiscussionPopup a", contactContainer).length > 1) {
        // more than one community available, show menu
        $(".jiveConvertDiscussionPopup", contactContainer).show();
    }
    else {
        // only one community, just simulate clicking it
        var btn = $(".jiveConvertDiscussionPopup a:first", contactContainer);
        btn.click();
    }

    return false;
}

function onOpenConvertedDiscussionsButtonClicked() {
    // show converted discussions for this community in new tabs
    var btn = $(this);
    closePopups();

    // open the sidebar for the selected community
    var serverUrl = btn.attr("data-serverurl");
    PageModuleContext.showSidebar(false, serverUrl);

    return false;
}

function onToolbarButtonClicked() {
    // depends on the count of converted discussions we choose the action to perform
    if (_view.convertedDiscussionInfo.length == 0) {
        onConvertButtonClicked();
    }
    else {
        onOpenConvertedDiscussionsButtonClicked();
    }
    return false;
}

function onViewAsDiscussionButtonClicked() {
    var contactContainer = $(this).closest(".jiveContactPanel");
    toggleOriginalMailVisibility(false);
    $(".jiveEmbeddedFrame").show();
    $(".jiveViewAsDiscussionButton", contactContainer).hide();
    $(".jiveViewAsEmailButton", contactContainer).show();
    setScrollTop(0);
    return false;
}

function onViewAsEmailButtonClicked() {
    var contactContainer = $(this).closest(".jiveContactPanel");
    toggleOriginalMailVisibility(true);
    $(".jiveEmbeddedFrame").hide();
    $(".jiveViewAsDiscussionButton", contactContainer).show();
    $(".jiveViewAsEmailButton", contactContainer).hide();
    setScrollTop(0);
    return false;
}

function onScrollTopButtonClicked() {
    setScrollTop(0);
    return false;
}

function onSelectedContactChanged() {
    // occurs when the contacts dropdown list selection changed
    _view.selectedUserIndex = parseInt($(this).val());
    _view.isDiscussionView = _view.isDiscussion && $(".jiveEmbeddedFrame:visible").length > 0;

    renderContactsPanel();
}

function renderContactsPanel() {
    if (_contactPanel) {
        getUserDetails(_view.selectedUserIndex, function (user) {
            _view.user = user;
            var html = $.render.profileTemplate(_view);
            _contactPanel.html(html);
        });
    }
}

function processImages(imgs, uploadImages, callback) {
    if (uploadImages) {
        JCommon.asyncRunForArray(imgs, function (img, submitResultCallback) {
            // upload img to Jive server using module.js
            var src = JCommon.getNonRelativeUrl(img.attr("src"));
            PageModuleContext.sendMessage("uploadImage", src, submitResultCallback);
        }, function (results) {
            // runs after all items in the array completed
            // replace img src for each collected img
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var img = imgs[i];

                if (!result || result.isError) {
                    // error, remove the src
                    img.replaceWith($("<div />").text("<embedded image was not included in the discussion due to an error>"));
                }
                else {
                    // succeed, set embedded img Jive attributes                    
                    img.attr("__jive_ID", result.id);
                    img.attr("src", result.name);
                }
            }

            callback();
        });
    }
    else {
        // remove embedded img srcs and add placeholders
        for (var i = 0; i < imgs.length; i++) {
            imgs[i].replaceWith($("<div />").text("<embedded image was not included in the discussion>"));
        }
        callback();
    }
}

function getUserDetails(userIndex, callback) {
    // this function gets the matching profile from the server or cache
    if (_view.currentUsers.length > userIndex) {
        // get the user object by the index
        var userObj = _view.currentUsers[userIndex];
        // build the cache key for the user object
        var cacheKey = userObj.email ? userObj.email : userObj.serverUrl + "+" + userObj.id;

        // annonymous function that is called after a user request completes
        var loadCompletedCallback = function (user) {
            // add user to the cache (even if not found, so we won't try to find it again)
            if (user) {                
                // update list of current users (used to render the dropdown list) with the real user name found
                userObj.name = user.displayName ? user.displayName : user.userName;
            }
            else {
                // user not found, for non-indexed users just use the user object's email field
                user = { emailAddress: userObj.email, displayName: userObj.name };
            }

            _usersCache[cacheKey] = user;
            callback(user);
        }

        // get user details by Id or Email address
        if (_usersCache[cacheKey]) {
            // user found in the cache, render the template and return
            var user = _usersCache[cacheKey];

            // update list of current users (used to render the dropdown list) with the real user name found
            userObj.name = user.displayName ? user.displayName : user.userName;
            callback(user);
        }
        else {
            // user was not found in the cache
            if (userObj.email) {
                // search user by email in all communities (for regular email)
                PageModuleContext.sendMessage("searchUserByEmail", { email: userObj.email }, loadCompletedCallback);
            }
            else {
                // search user by id in the community of the discussion (for discussion view)
                PageModuleContext.sendMessage("getUserById", { id: userObj.id, serverUrl: userObj.serverUrl }, loadCompletedCallback);
            }
        }
    }
    else {
        // element not found
        callback(null);
    }
}

// ------------------------------------------------ Global Helper functions -------------------------------------

function parseEmailHeaders(str) {
    var headers = {};
    var curHeaderName;
    var arr = str.split("\n");
    if (arr.length == 1) {
        // fix for OWA and IE
        arr = str.split("\r");
    }

    for (var i = 0; i < arr.length; i++) {
        if ($.trim(arr[i].substring(0, 1)) == "") {
            if (curHeaderName) {
                // continue parsing value
                headers[curHeaderName] += $.trim(arr[i]);
            }
        }
        else {
            // check for new header
            curHeaderName = arr[i].substring(0, arr[i].indexOf(":")).toUpperCase();
            if (curHeaderName && curHeaderName.indexOf(" ") == -1) {
                // new header is parsed
                headers[curHeaderName] = $.trim(arr[i].substring(curHeaderName.length + 1))
            }
            else {
                // not a valid header name
                curHeaderName = null;
            }
        }
    }

    return headers;
}



// --------------------------------------------- Gmail specific implementation -----------------------------------

function isWebAppReady() {
    // check if the main layout element exists (appears after loading message completed)
    return $(".ash").length > 0;
}

function isEmailView() {
    // check if the subject element exists
    return $(".hP:visible").length > 0;
}

function setCallbackForItemViewChanged(itemChangedCallback) {
    // invoke the callback each time the current item in view has changed
    $(window).on("hashchange", itemChangedCallback);
}

function getMessageCacheId() {
    // returns the id of the current message in order to manage the cache for getOriginalMessage
    var itemId = $(".ii.gt:visible").last().attr("class").split(' ')[2].substring(1);
    return itemId;
}

function getOriginalMessage(callback) {
    // get the URL required for original message content (of the last message in thread)
    var script = $("body script:eq(1)");
    var authKey = script[0].text.split(',')[9].replace(/"/g, "");
    var itemId = $(".ii.gt:visible").last().attr("class").split(' ')[2].substring(1);
    var url = "/mail/?ui=2&ik=" + escape(encodeURIComponent(authKey)) + "&view=om&th=" + escape(encodeURIComponent(itemId));

    // send AJAX request to Gmail on behalf of the user to get the original message content
    $.get(url, function (originalMessage) {
        callback(originalMessage);
    });
}

function toggleOriginalMailVisibility(show) {
    $('.aeF .nH[role="main"] .nH.aHU').toggle(show);
    $(".jiveJviewContainer").toggle(!show);
}

function appendJviewFrame(frame) {
    // hide the default Gmail mail view container and append jview frame
    var container = $('<div class="jiveJviewContainer" />').append(frame);
    $('.aeF .nH[role="main"] .nH.aHU:visible').hide().after(container);
}

function setScrollTop(top) {
    $(".Tm.aeJ").scrollTop(top);
}

function addContactsPanel() {
    // create an empty pane for contacts info at the right bar
    var container = $(".nH.adC > .nH:visible");
    var panel = $('<div class="jiveAnywhereContact" />');
    container.prepend(panel);
    return panel;
}

function getAllContactsInView() {
    // get all email elements in the view and create a dictionary
    var items = {};
    var elems = $('.nH.aHU .gD[email]:visible');
    for (var i = 0; i < elems.length; i++) {
        var email = elems.eq(i).attr("email");
        if (!email) {
            email = "unknown";
        }
        var name = elems.eq(i).text();
        items[email] = name;
    }

    // convert the dictionary to array
    var arr = [];
    for (var key in items) {
        arr.unshift({ email: key, name: items[key] });
    }

    return arr;
}

function prepareToConvert() {
    // expand all replies (we call this in advanced because Gmail needs to load some of the replies from the server)
    expandAllReplies();
}

function getEmailSubject() {
    var subjectSpan = $('span.hP:visible');
    return subjectSpan.text();
}

function getConversationToConvert(imgs, attachments) {    
    // get conversation object ready for convert
    expandAllReplies();
    var messages = [];
    var messagesDiv = $('.h7:visible');
    var subjectSpan = $('span.hP:visible');

    // read each message in the thread
    for (var i = 0; i < messagesDiv.length; i++) {
        var sender = $('.gD:visible:first', messagesDiv[i]);
        var message = {};
        var body = $('.ii.gt.adP > div', messagesDiv[i]).clone();

        // clean the message cloned body (remove the original message section)
        $(".yj6qo, .gmail_extra, .adL", body).remove();
        body.attr("style", "").attr("id", "");

        // find embedded imgs and append to the imgs array
        $("img[src]", body).each(function () {
            var img = $(this);
            var src = img.attr("src");

            if (src.indexOf("?ui=2") == 0) {
                // found embedded img
                imgs.push(img);
            }
        });

        // find attachments and add src urls to array
        $('.cf.hr .ZVtMlf[target!="_blank"]', messagesDiv[i]).each(function () {
            var src = JCommon.getNonRelativeUrl($(this).attr("href"));
            attachments.push({ src: src, messageIndex: i });
        });

        message.bodyElem = body;
        message.subject = subjectSpan.text();
        message.sender = sender.attr("email"); // email
        message.senderName = sender.attr("name"); // name
        message.attachmentUris = [];
        messages.push(message);
    }

    return messages;    
}

function showToolbarButton(countConvertedDiscussions) {
    var convertBtn = $(".jiveToolbarButton:visible");

    if (convertBtn.length == 0) {
        // add a convert button to Gmail toolbar if it is not already exist
        var commandBar = $('.iH .G-Ni.J-J5-Ji:visible:eq(2)');

        if (commandBar.length == 1) {
            if (commandBar.children().length == 2) {
                commandBar.children().last().addClass('T-I-Js-IF');
                var convertBtn = $('<div class="jiveToolbarButton T-I J-J5-Ji T-I-Js-Gs ar7 ns T-I-ax7 L3" role="button" tabindex="0" aria-expanded="false" style="-webkit-user-select: none;" aria-haspopup="true" data-tooltip="Convert to Discussion" aria-activedescendant=""><div class="asa"><span class="J-J5-Ji ask">&nbsp;</span><div class="T-I-J3 J-J5-Ji jiveConvertButtonImg"></div></div></div>');
                commandBar.append(convertBtn);

                // set button events
                convertBtn.hover(
                    function () {
                        $(this).addClass("T-I-JW");
                    },
                    function () {
                        $(this).removeClass("T-I-JW");
                    }
                );
            }
        }
    }

    if (countConvertedDiscussions > 0) {
        // change button color and tooltip if there are converted discussions
        convertBtn.css("background", "lightblue").attr("data-tooltip", "Show converted discussions (" + countConvertedDiscussions + ")");
    }
}

// ------------------------------------------------ Gmail specific helpers --------------------------------------

function expandAllReplies() {
    // click the expand all button if visible (this process is asyncronious, it sometimes get additional data from Gmail server)
    $(".gx:visible").click();
}
