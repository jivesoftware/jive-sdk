var util = require('util');
var definitions = require('./definitions');

function ExtstreamsDefinitions() {
}

util.inherits(ExtstreamsDefinitions, definitions);

ExtstreamsDefinitions.prototype.getCollection = function () {
    return "extstreamsDefinition";
};

module.exports = ExtstreamsDefinitions;
