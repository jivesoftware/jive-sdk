var baseTest = require('../../util/baseSuite.js');
var assert = require('assert');
var Mocha = require( 'mocha');

var test = Object.create(baseTest);
module.exports = test;

// not strictly necessary ... just here for an example custom run.js

test.getParentSuiteName = function() {
    return 'jive';
};