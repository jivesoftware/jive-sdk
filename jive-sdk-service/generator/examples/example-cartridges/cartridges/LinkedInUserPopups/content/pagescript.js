/* LinkedIn module for Jive Anywhere (page content script)

   PageModuleContext, JCommon and $ are provided by the module manager
*/

var isTooltipVisible = false;

var checkPopupVisibility = function () {
    var popup = $("#lui-mini-profile-body");
    var name = $(".name > a", popup).text();

    if (popup.length == 1 && popup.css("display") != "none" && name) {
        // visible popup found
        if (!isTooltipVisible) {
            // current monitored visibility flag has changed
            isTooltipVisible = true;
            //console.log("Invoking LinkedIn profile search for Jive user: " + name);

            // send a message to module.js (background context) for getting rendered html for hovered user
            PageModuleContext.sendMessage("getProfile", name, function (html) {

                // create DOM object from received HTML string
                var jiveSection = $.parseHTML(html);

                // create the container if it doesn't exist
                var container = $(".miniprofile-shared-connections", popup);
                if (container.length == 0) {
                    $(".miniprofile-body", popup).after('<div class="miniprofile-shared-connections"></div>');
                }

                // append templated HTML into the popup and start animation
                container.prepend(jiveSection);
                $(jiveSection).slideDown();
            });
        }
    }
    else {
        // clear the visibility flag
        isTooltipVisible = false;
    }
};

this.init = function (params, sendResponse) {
    // create a timer interval that checks if the user popup visibility has changed each 0.5 seconds
    window.setInterval(checkPopupVisibility, 500);
};