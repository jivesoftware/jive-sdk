var $ = require('jquery'),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

$.support.cors = true;
$.ajaxSettings.xhr = function () {
    return new XMLHttpRequest;
}

global.jQuery = $;
