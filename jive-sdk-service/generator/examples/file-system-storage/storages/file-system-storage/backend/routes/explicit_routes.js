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
exports.uploadVersion = {
    'verb':'post',
    'route': service.uploadVersion
};
exports.download = {
    'verb':'get',
    'route': service.downloadVersion
};
exports.place = {
    'verb':'delete',
    'route': service.deleteContainer
};
exports.file = {
    'verb':'delete',
    'route': service.deleteFile
};


