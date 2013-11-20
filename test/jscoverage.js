var jscoverage = require('jscoverage');

function func(input) {
    input = JSON.parse(input['func']);

    var src = input['apiDirSrc'];
    var target = input['apiDirTarget'];

    jscoverage.processFile(src, target);
    process.send('Done');
}

process.on('message', function(m) {
    func(m);
});