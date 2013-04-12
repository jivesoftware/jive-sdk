var util = require('util');
var definitions = require('./definitions');

util._extend( exports, definitions );

function tilesDefinitions() {
}

util.inherits(tilesDefinitions, definitions);

//extstreamsDefinitions.prototype.inherited =  function() {
//    console.log('inhertied');
//};

module.exports = tilesDefinitions;
