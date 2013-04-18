var Mocha = require('mocha'),
    path = require('path'),
    fs = require('fs'),
    jive = require('../../jive-sdk'),
    http = require('http');

var configuration = {
    'port' : 8094,
    'clientUrl' : 'http://localhost',
    'clientId'      : '6bgwdhc0rwifutkywsua19c49yt2qs2r',
    'clientSecret'  : '6iyjdimjzg5jbmvozv03dj0ogdzi3y.XKSkGTDsYznPZLd0zM0ZU06ExHA.1.s'
};

jive.service.options = configuration;

var serverProcess = require('child_process').fork('./test-server',  {execArgv: []});
var serverStartedCallback = function(m) {

    console.log(m);
    var success = m.serverStarted;
    if (success) {
        console.log("Test server started, running tests");
        runMocha();
    }
    else {
        console.log("Failure starting test server!");
    }
    serverProcess.removeAllListeners('message');
};

serverProcess.on('message', serverStartedCallback);

serverProcess.send({pleaseStart: true, config: configuration});

function runMocha() {
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
            serverProcess.send({pleaseStop: true});

            console.log('finished');
        });

        runner.on('pass', function (test) {
            console.log('...Test "%s" passed', test.title);
        });

        runner.on('fail', function (test) {
            console.log('...Test "%s" failed', test.title);
            if (test.err && (test.err.expected || test.err.actual) ) {
                console.log('Expected: \'%s\', Actual: \'%s\'', test.err.expected, test.err.actual);
            }
        });
    });
}

exports.serverProcess = function() {
    return serverProcess;
}
