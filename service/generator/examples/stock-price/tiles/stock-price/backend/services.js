/*jshint laxcomma:true */

var jive = require('jive-sdk')
  , q    = require('q')
  , http = require('q-io/http');

exports.task = new jive.tasks.build(function() {
    jive.tiles.findByDefinitionName('{{{TILE_NAME}}}').then(function(tiles) {
        tiles.forEach(pushUpdate);
    });
}, 60000);

function pushUpdate(tile) {
    console.log('pushing update: '+ tile.name +', '+ tile.id);
    var symbol   = tile.config.symbol || 'JIVE';
    var exchange = tile.config.exchange;
    fetchData(symbol, exchange)
    .then(prepareData.bind(null, tile))
    .then(function(data) {
        jive.tiles.pushData(tile, { data: data });
    });
}

function fetchData(symbol, exchange) {
    var base = 'https://query.yahooapis.com/v1/public/yql';
    var params  = {
        format: 'json',
        diagnostics: false,
        env: 'http://datatables.org/alltables.env'
    };
    var query = 'select * from yahoo.finance.quotes where symbol="'+ symbol +'"';
    if (exchange) {
        query += ' and StockExchange like "'+ exchange +'%"';
    }
    params.q = query;
    return http.read(formatUrl(base, params)).then(JSON.parse).then(function(data) {
        return data.query.results.quote;
    });
}

function prepareData(tile, data) {
    var config = tile.config;
    var latestPrice = data.LastTradePriceOnly;
    if (config.Change) {
        latestPrice += ' '+ data.Change;
    }
    if (config.Change && config.ChangeinPercent) {
        latestPrice += ' ('+ data.ChangeinPercent +')';
    }
    else if (config.ChangeInPercent) {
        latestPrice += ' '+ data.ChangeInPercent;
    }

    var fields = Object.keys(config.fields).map(function(field) {
        return {
            name: formatField(field),
            value: data[field]
        };
    }).slice(0, 9);

    var qualifiedSymbol = (config.exchange ? config.exchange + ':' : '') + data.symbol;

    return {
        title: data.symbol + (config.exchange ? ' on '+ config.exchange : ''),
        contents: [{ name: data.symbol, value: latestPrice }].concat(fields),
        action: {
            text: 'Google Finance: '+ qualifiedSymbol,
            url: 'https://www.google.com/finance?q='+ qualifiedSymbol
        }
    };
}

function formatUrl(base, params) {
    var sep = base.indexOf('?') < 0 ? '?' : '&';
    return base + sep + Object.keys(params).map(function(k) {
        return encodeURIComponent(k) +'='+ encodeURIComponent(params[k]);
    }).join('&');
}

function formatField(fieldName) {
    return fieldName
    .replace(/[A-Z]/g, function(l) {
        return ' '+ l.toLowerCase();
    })
    .replace(/days/, "day's")
    .trim();
}

exports.eventHandlers = [

    {
        'event': 'newInstance',
        'handler' : function(theInstance){
            jive.logger.info("Caught newInstance event, trying to push now.");
            pushUpdate(theInstance);
        }
    },


    {
        'event': 'destroyingInstance',
        'handler' : function(theInstance){
            // override
        }
    },

    {
        'event': 'destroyedInstance',
        'handler' : function(theInstance){
            // override
        }
    },

    {
        'event': 'dataPushed',
        'handler' : function(theInstance, pushedData, response){
            // override
        }
    }

];
