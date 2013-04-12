var util = require('util');
var definitions = require('./definitions');

util._extend( exports, definitions );

function extstreamsDefinitions() {
}

util.inherits(extstreamsDefinitions, definitions);

extstreamsDefinitions.prototype.getCollection = function () {
    return "extstreamsDefinition";
};

module.exports = extstreamsDefinitions;
