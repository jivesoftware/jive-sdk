var service = require('../storage_service.js');
exports.isAlive = {
    'path': '/fsstorage/isAlive',
    'verb': 'post',
    'route': function (req, res) {
        res.writeHead(200);
        res.end("Alive!");
    }
};
exports.register = {
    'path': '/fsstorage/register',
    'verb': 'post',
    'route': service.registerPlace
};
exports.upload = {
    'path': '/fsstorage/upload',
    'verb': 'post',
    'route': service.uploadFile
};
exports.uploadVersion = {
    'path': '/fsstorage/uploadVersion',
    'verb': 'post',
    'route': service.uploadVersion
};
exports.download = {
    'path': '/fsstorage/download',
    'verb': 'get',
    'route': service.downloadVersion
};
exports.place = {
    'path': '/fsstorage/place',
    'verb': 'delete',
    'route': service.deleteContainer
};
exports.file = {
    'path': '/fsstorage/file',
    'verb': 'delete',
    'route': service.deleteFile
};


