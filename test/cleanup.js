var testUtils = require('./util/testUtils');

testUtils.fsread( 'coverage.html' ).then( function(data) {
    var text = new Buffer(data).toString();
    var text = text.split('<!DOCTYPE html>')[1];
    return text;
}).then( function(text) {
    testUtils.fswrite( text, 'coverage.html');
});