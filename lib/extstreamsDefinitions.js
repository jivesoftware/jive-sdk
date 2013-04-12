var util = require('util');
var definitions = require('./definitions');

util._extend( exports, definitions );

function extstreamsDefinitions() {
}

util.inherits(extstreamsDefinitions, definitions);

//extstreamsDefinitions.prototype.inherited =  function() {
//    console.log('inhertied');
//};

module.exports = extstreamsDefinitions;
