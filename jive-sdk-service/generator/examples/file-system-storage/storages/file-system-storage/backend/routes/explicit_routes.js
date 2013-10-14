var service = require('../storage_service.js');
exports.isAlive = {
    'verb' : 'post',
    'route': function(req,res) {
        res.writeHead(200);
        res.end("Alive!");
    }
};
exports.register = {
    'verb':'post',
    'route': service.registerPlace
};
exports.upload = {
    'verb':'post',
    'route': service.uploadFile
};
exports.place = {
    'verb':'delete',
    'route': service.deleteContainer
};
