function fixLinks(content) {
    var $firstPara = $("<div>" + content + "</div>").find("p").not("table p").first();
    // Now update the hyperlinks from relative to absolute
    $firstPara.find("a").each(function() {
        var index = this.href.indexOf("/wiki/");
        if (index != -1) {
            var root = "http://en.wikipedia.org";
            this.href = root.concat(this.href.slice(index));
            this.setAttribute("target", "_blank");
        }
    });
    return $firstPara;
}

function extractImage(content) {
    var result;
    var $thumbdiv = $("<div>" + content + "</div>").find("div.thumb");
    var $img = $thumbdiv.find("img");
    var src = $img.attr("src");
    var url = gadgets.io.getProxyUrl( "http://upload.wikimedia.org/wikipedia/en/b/bc/Wiki.png" );
    var alt = "empty";
    if (src) {
        if ( src.indexOf("http") !== 0 ) {
            src = "http:" + src;
        }
        url = gadgets.io.getProxyUrl( src );

        if ( url.indexOf("http") !== 0 ) {
            var serverRoot = gadgets.config.get()['jive-opensocial-ext-v1']['jiveUrl'];
            var protocol = serverRoot.split("//")[0];
            url = protocol + ":" + url;
        }

        if ($img.attr("alt")) {
            alt = $img.attr("alt");
        }
    }
    result = $("<img src='" + url + "' alt='" + alt + "' class='align-right frame'/>");

    if (!($.browser.msie && $.browser.version < 8)) {
        result.load(function() {
            $('.loading').fadeOut('fast', function() {
                $('#content').fadeIn('slow');
                gadgets.window.adjustHeight();
            });
        });
    } else {
        $('.loading').fadeOut('fast', function() {
            $('#content').fadeIn('slow');
            gadgets.window.adjustHeight();
        });
    }

    return result;
}

//fetches the page corresponding to the title passed in
function display(title) {

    var callback = function(response) {

        var data = JSON.parse(response.text);

        if (data.error) {
            $("#title").html("Topic Not Found");
            $("#thumbnail").empty();
            $('#display').html("<div id='error'><p>" + data.error.info + "</p></div>");
            $('#display').scrollTop(0);
            $('.loading').fadeOut('fast', function() {
                $('#content').fadeIn('slow');
            });
            $('#ok').addClass("disabled");
            $('#searchinput').focus();
            return;
        }
        var content = data.parse.text['*'];
        // See if the search result we got was a redirect to another result.
        if (content.indexOf("REDIRECT") != -1) {
            var redirectPhrase = $("<div>" + content + "</div>").find("a:first").text();
            $('#searchinput').val(redirectPhrase);
            return display(redirectPhrase);
        }
        $("#title").html(title);
        var thumbnail = extractImage(content);
        $("#thumbnail").html(thumbnail);
        var contentz = fixLinks(content);
        $('#display').html(contentz);
        $('#display').scrollTop(0);
    };

    var url = "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&page=" + encodeURIComponent(title);

    $('#content').hide();
    $('.loading').show();
    gadgets.io.makeRequest(url, callback);

}
