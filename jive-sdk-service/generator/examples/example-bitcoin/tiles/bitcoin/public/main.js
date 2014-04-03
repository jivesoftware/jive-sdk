jive.tile.onOpen(function(data, options) {
    var $form = $('form');

    $form.find('input[value="'+ data.symbol +'"]').prop('checked', true);

    $form.bind('submit', function(event) {
        event.preventDefault();
        var param = $(this).serializeArray().filter(function(p) {
            return p.name === 'symbol';
        })[0];
        var symbol = (param && param.value) || 'USD';
        jive.tile.close({ symbol: symbol }, resetData());
    });

    gadgets.window.adjustHeight();

    function resetData() {
        options.definitions.filter(function(d) {
            return d.name === '{{{TILE_NAME}}}';
        }).forEach(function(def) {
            (def.data.contents || []).forEach(function(c) {
                c.value = '--';
            });
        });
        return options.definitions;
        //var def = options.definitions.filter(function(d) {
        //    return d.name === 'bitcoin';
        //})[0];
        //if (def) {
        //    $.each(def.data.contents, function() {
        //        this.value = '--';
        //    });
        //    return def.data;
        //}
    }
});
