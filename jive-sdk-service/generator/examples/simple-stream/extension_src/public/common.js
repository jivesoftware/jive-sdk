function getAddonURL() {
    // If Gala tile service is enabled, there will be a gala object present
    if (typeof gala === "object"){
        return jive.tile.getAppURL();
    }

    var matches = window.location.href.match(/.*?[?&]url=([^&]+)%2F.*$/);
    if (matches.length == 2) {
        return decodeURIComponent(matches[1]);
    } else {
        showError('Could not parse addon URL from window location', window.location.href);
        return '';
    }
}

function getJiveURL() {
    // If Gala tile service is enabled, there will be a gala object present
    if (typeof gala === "object"){
        return jive.tile.getJiveURL();
    }

    var href = getAddonURL();
    var JiveUrl = href.substring(0, href.indexOf('/resources/add-ons'));
    return JiveUrl;
}

function showNotification(notice, extra) {
    extra = extra || '';
    osapi.jive.core.container.sendNotification(
        {
            "severity" : "info",
            "message": (i18n(notice) || notice) + extra
        }
    );
}

function extensionID() {
    return '{{{GENERATED_UUID}}}';
}

function i18n(msg) {
    var prefs = new gadgets.Prefs();
    return prefs.getMsg(msg);
}

function randomString(len, chars) {
    var a = [];
    chars = chars || "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var count = chars.length;
    for (var i = 0; i < len; i++) {
        a.push(chars.charAt(Math.floor(Math.random() * count)));
    }
    return a.join("");
}