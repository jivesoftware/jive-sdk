var testUtils = require('./util/testUtils');
var path = process.argv[2];

console.log(path);
testUtils.fsread( path ).then( function(data) {
    var text = new Buffer(data).toString();
    var text = text.split('<!DOCTYPE html>')[1];
    return text;
}).then( function(text) {
    testUtils.fswrite( text, path);
});
