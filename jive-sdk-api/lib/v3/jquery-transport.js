var $ = require('jquery'),
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

$.support.cors = true;
$.ajaxSetup({
    xhr: function () {
        return new XMLHttpRequest;
    }
});

global.jQuery = $;
