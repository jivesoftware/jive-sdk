var baseTest = require( process.cwd() + '/util/baseSuite.js');
var assert = require('assert');
var Mocha = require( 'mocha');
var jive = require('../../jive-sdk-service/api');

var test = Object.create(baseTest);
module.exports = test;

test.getTestDir = function() {
    return process.cwd() + '/unit/testcases/';
};


test.setupSuite = function(test) {
    // call super
    baseTest.setupSuite(test);

    // do something specific to this suite
};

test.getParentSuiteName = function() {
    return 'jive.util';
};