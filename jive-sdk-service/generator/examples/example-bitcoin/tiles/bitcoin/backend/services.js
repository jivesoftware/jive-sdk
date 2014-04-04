/*jshint laxcomma:true */

var jive = require('jive-sdk')
  , q    = require('q')
  , http = require('q-io/http');

exports.task = new jive.tasks.build(function() {
    var tiles = jive.tiles.findByDefinitionName('{{{TILE_NAME}}}').then(function(instances) {
        return instances || [];
    });
    var prices = tiles.then(function(ts) {
        return ts.length ? fetchPrices() : q.deferred({});
    });
    q.all([tiles, prices]).then(function(results) {
        var ts = results[0]
          , ps = results[1];
        ts.forEach(pushUpdate.bind(null, ps));
    });
}, 600000);

function fetchPrices() {
    var pricesUrl = 'http://api.bitcoincharts.com/v1/weighted_prices.json';
    return http.read(pricesUrl).then(JSON.parse);
}

function pushUpdate(prices, tile) {
    console.log('Pushing update: '+ tile.name +', '+ tile.id);
    var symbol   = tile.config.symbol || 'USD';
    var myPrices = prices[symbol];

    var data = {
        data: {
            "title" : "Bitcoin Exchange Rates",
            "contents" : ['24h', '7d', '30d'].map(function(t) {
                return { name: t, value: myPrices[t] + ' ' + symbol };
            }),
            "action" : {
                "text" : "bitcoincharts.com",
                "url"  : "http://bitcoincharts.com/"
            }
        }
    };

    jive.tiles.pushData(tile, data);
}

exports.eventHandlers = [
    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : function(theInstance){
            if ( theInstance['name'] !== '{{{TILE_NAME}}}') {
                return;
            }

            jive.logger.info("Caught newInstance event, trying to push now.");
            fetchPrices().then(function(prices) {
                jive.logger.info("Fetched prices", prices);
                pushUpdate(prices, theInstance);
            });
        }
    }
];
