var Mocha = require('mocha'),
    path = require('path'),
    fs = require('fs'),
    jive = require('../../jive-sdk'),
    http = require('http');

var configuration = {
    'port' : 8093,
    'clientUrl' : 'http://localhost',
    'clientId'      : '4mkgdszjkbzfjwgwsjnj0r5q1db9n0fh',
    'clientSecret'  : 'rm93mbrpr8an2eajq439625vzg3xqp.MyvfefMHZlEv4E49WH6AC90cw2U.1.s',
    'persistence' : new jive.persistence.memory()
};

jive.service.init( null, configuration );

var serverChild = require('child_process').fork('./test-server',  {execArgv: []});

serverChild.on('message', function(m) {
    console.log("Child server process started");
    console.log(m);
    runMocha();
});

serverChild.send({pleaseStart: true});

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
            console.log('finished');
        });

        runner.on('pass', function (test) {
            console.log('... %s passed', test.title);
        });

        runner.on('fail', function (test) {
            console.log('... %s failed', test.title);
        });
    });
}


//Helpers

function waitSynchronous(ms) {
    var date = new Date();
    do {
        var currentDate = new Date();
    } while (currentDate - date < ms);
}

function wait(serverName) {
    var gotOK = false;


    while (!gotOK) {
        jive.util.buildRequest(serverName).execute(
            function(res) {
                if (res.responseCode === 200) {
                    gotOK = true;
                }
            },
            function(err) {
                console.log("Failed to connect to test server '" + serverName + "'");
                console.log(err);
            });

        waitSynchronous(2000);
    }

}
