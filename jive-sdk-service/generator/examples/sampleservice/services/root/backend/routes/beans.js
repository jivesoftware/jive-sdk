exports.goodbye = {
    'verb' : 'get',
    'route': function(req,res) {
        res.writeHead(200);
        res.end("goodbye!");
    }
};