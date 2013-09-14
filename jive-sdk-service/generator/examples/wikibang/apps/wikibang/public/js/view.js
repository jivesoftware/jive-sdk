gadgets.util.registerOnLoadHandler(function() {
    opensocial.data.getDataContext().registerListener('org.opensocial.ee.context',
    function(key) {
        var context = opensocial.data.getDataContext().getDataSet(key);
        if (context && context.target && context.target.context && context.target.context.page) {
            var title = context.target.context.page;
			display(title);
			$('#more').attr("href", "http://en.wikipedia.org/wiki/" + title);
            $('#more').show();
        }
    });

});