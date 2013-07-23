/*jshint laxcomma:true */

jive.tile.onOpen(function(config, options) {
    var $form = $('form');

    if (config.symbol) {
        $form.find('input[name="symbol"]').val(config.symbol);
    }
    if (config.exchange) {
        $form.find('input[name="exchange"]').val(config.exchange);
    }
    if (config.Change) {
        $form.find('input[name="Change"]').prop('checked', true);
    }
    if (config.ChangeinPercent) {
        $form.find('input[name="ChangeinPercent"]').prop('checked', true);
    }
    if (config.fields) {
        Object.keys(config.fields).forEach(function(field) {
            $form.find('input[name="fields/'+ field +'"]').prop('checked', true);
        });
    }

    gadgets.window.adjustHeight();

    $form.bind('submit', function(event) {
        event.preventDefault();
        var newConfig = {};
        $(this).serializeArray().forEach(function(p) {
            var parts = p.name.split('/')
              , prefix = parts.slice(0, -1)
              , field  = parts.slice(-1)[0]
              , obj;
            if (p.value) {
                obj = prefix.reduce(function(o, part) {
                    o[part] = o[part] || {};
                    return o[part];
                }, newConfig);
                obj[field] = $.trim(p.value);
            }
        });
        jive.tile.close(newConfig, resetData());
    });

    function resetData() {
        options.definitions.filter(function(d) {
            return d.name === '{{{TILE_NAME}}}';
        }).forEach(function(def) {
            (def.data.contents || []).forEach(function(c) {
                c.value = '--';
            });
        });
        return options.definitions;
    }
});
