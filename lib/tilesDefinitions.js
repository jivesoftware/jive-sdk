var util = require('util');
var definitions = require('./definitions');

util._extend( exports, definitions );

function tilesDefinitions() {
}

util.inherits(tilesDefinitions, definitions);

tilesDefinitions.prototype.getCollection =  function () {
    return "tileDefinition";
};

module.exports = tilesDefinitions;
