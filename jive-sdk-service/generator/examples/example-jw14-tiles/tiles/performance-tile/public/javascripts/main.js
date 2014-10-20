jive.tile.onOpen(function(config, options) {
    gadgets.window.adjustHeight();
    if (typeof config === "string") {
      config = JSON.parse(config);
    }
    var ranges = config.ranges || [ null, 2000, 1500, 1000 ];
    // fill form with current settings
    ranges.forEach(function(limit, index) {
      if (limit) {
        $("#limit_" + index).val(limit);
      }
    });
    $("#btn_submit").click(function() {
        ranges.forEach(function(limit, index) {
          if (limit) {
            ranges[index] = parseInt($("#limit_" + index).val()) || limit;
          }
        });
        config.ranges = ranges;
        jive.tile.close(config, {} );
    });
});
