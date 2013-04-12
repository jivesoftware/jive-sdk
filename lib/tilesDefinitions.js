var util = require('util');
var definitions = require('./definitions');

function TilesDefinitions() {
}

util.inherits(TilesDefinitions, definitions);

TilesDefinitions.prototype.getCollection =  function () {
    return "tileDefinition";
};

module.exports = TilesDefinitions;
