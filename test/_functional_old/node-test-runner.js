var Mocha = require('mocha'),
    path = require('path'),
    fs = require('fs'),
    jive = require('.'),
    http = require('http'),
    testUtil = require('./../functional/test-util');

var configuration = {
    'port' : 8106,
    'clientUrl' : 'http://localhost',
    'clientId'      : '6bgwdhc0rwifutkywsua19c49yt2qs2r',
    'clientSecret'  : '6iyjdimjzg5jbmvozv03dj0ogdzi3y.XKSkGTDsYznPZLd0zM0ZU06ExHA.1.s',
    'serverType' : 'integrationServer',
    'serverName' : "Test Integration Server",
    'logFile' : 'logs/test-integration-server.log',
    'persistence': 'memory'
};

jive.service.options = configuration;

testUtil.createServer(configuration).then(runMocha);

var integrationServerProc;

function runMocha(serverProc) {
    integrationServerProc = serverProc;
    //Run all tests in subfolder 'testcases'
    var mocha = new Mocha({
        reporter: 'dot',
        ui: 'bdd',
        timeout: 10000
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

            testUtil.stopServer(integrationServerProc);

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
    return integrationServerProc;
}