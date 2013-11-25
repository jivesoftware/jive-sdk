var TestServer = require('./baseServer');
var server = {
    'startServer' : function(){},
    'stopServer' : function(){},
    'doOperation' : function(){}
};

process.on('message', function(m) {

    if (m['pleaseStart'] === true) {
        server = new TestServer.instance(m.config);
        server.startServer();
    }

    if (m['pleaseStop'] === true) {
        server.stopServer(m.id);
    }

    if ( m['operation'] ) {
        var context = server.doOperation( m['operation'] );
        process.send({
            operationSuccess: true,
            id: m.id,
            context: context
        });
    }
});
