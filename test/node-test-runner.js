var Mocha = require('mocha'),
    path = require('path'),
    fs = require('fs'),
    jive = require('../../jive-sdk')

var configuration = {
    'port' : 8091,
    'baseUrl' : 'http://charles-z800.jiveland.com',
    'clientId' : '766t8osmgixp87ypdbbvmu637k98fzvc',
    'persistence' : new jive.persistence.mongo()
};

jive.config.save( configuration );

//Run all tests in subfolder 'testcases'
var mocha = new Mocha({
    reporter: 'dot',
    ui: 'bdd',
    timeout: 999999
});

var testDir = './testcases/';

fs.readdir(testDir, function (err, files) {
    if (err) {
        console.log(err);
        return;
    }
    files.forEach(function (file) {
        if (path.extname(file) === '.js') {
            console.log('adding test file: %s', file);
            mocha.addFile(testDir + file);
        }
    });

    var runner = mocha.run(function () {
        console.log('finished');
    });

    runner.on('pass', function (test) {
        console.log('... %s passed', test.title);
    });

    runner.on('fail', function (test) {
        console.log('... %s failed', test.title);
    });
});
