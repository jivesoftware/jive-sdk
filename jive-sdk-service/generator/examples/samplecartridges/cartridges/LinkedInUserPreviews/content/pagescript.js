/* LinkedIn module for Jive Anywhere (page content script)

   PageModuleContext, JCommon and $ are provided by the module manager
*/

this.getPreviewData = function (params, sendResponse) {
    var profile = new Object();

    profile.fields = [];
    profile.url = document.location.href;
    profile.name = $(".full-name").text();
    profile.locality = $(".locality:eq(0)").text();
    profile.industry = $(".industry:eq(0)").text();    

    if ($(".profile-overview").length > 0) {
        // new LinkedIn site
        profile.image = $(".profile-picture img").first().attr("src");
        profile.title = $("p.title:eq(0)").text();

        $(".profile-overview table").find("th").each(function (index) {
            var title = $("a[data-trk]", this).text();
            if (title != "Websites") {
                var data = $(this).next("td").find("li");
                var values = [];
                data.each(function () {
                    var value = $(this).text();
                    if (value.substring(0, 1) == ",") {
                        value = value.substring(1);
                    }
                    values.push(value);
                });
                if (data.length > 0) {
                    profile.fields.push({ name: title, values: values });
                }
            }
        });
    }
    else if ($(".profile-header").length > 0) {
        // old LinkedIn site
        profile.image = $("#profile-picture img").first().attr("src");
        profile.title = $(".headline-title").text();

        $("#overview").find("dt").each(function (index) {
            var title = $(this).text();
            if (title != "Websites") {
                var data = $(this).next("dd").find("li");
                var values = [];
                data.each(function () {
                    var value = $(this).text();
                    values.push(value);
                });
                if (data.length > 0) {
                    profile.fields.push({ name: title, values: values });
                }
            }
        });
    }

    if (!profile.image) {
        // use default profile image
        profile.image = "http://static02.linkedin.com/scds/common/u/img/icon/icon_no_photo_40x40.png";
    }

    sendResponse(profile);
};
