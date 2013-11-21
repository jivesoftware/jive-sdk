var baseTest = require('./util/baseSuite.js');
var test = Object.create(baseTest);
module.exports = test;

test.getParentSuiteName = function() {
    return 'jive';
};