var jive = require('jive-sdk');
var fs = require('fs');
var q = require('q');


var logger = require('log4js').getLogger('storage-service');

exports.registerPlace = function (req, res) {
    logger.info("Registering place...");

    // TODO: generate AccessToken.
    //{ "jiveUrl": req.body.jiveUrl, "containerId": req.body.container.id }
    var cotainerGuid = jive.util.guid();

    // We create a new folder for the created group.
    // Since this is a sample code we don't handle the case of 2 groups with the same name.
    var containerPath = jive.service.options.rootFolder + "/" + req.body.container.name;
    jive.util.fsexists(containerPath)
        .then(function (exists) {
            if (!exists) {
                return jive.util.fsmkdir(containerPath);
            } else {
                return q.fcall(function () {
                });
            }
        })
        .then(function () {
            logger.info("Directory for group " + req.body.container.name + " was created in: " + containerPath);
            req.body.containerPath = containerPath;
            return jive.context.persistence.save("places", cotainerGuid, req.body);
        })
        .then(function () {
            var responseBody =
            {
                'externalId': cotainerGuid,

                //These resources are used by the jive server side to upload data later on to this service.
                //By using to container guid as part of the URL we can later identify where to save the uploaded file.
                'resources': [
                    {
                        'name': 'self',
                        'url': '/file-system-storage/place?container=' + cotainerGuid,
                        'verbs': ['GET', 'PUT', 'DELETE']
                    },
                    {
                        'name': 'uploadFile',
                        'url': '/file-system-storage/upload?container=' + cotainerGuid,
                        'verbs': ['POST']
                    }
                ]
            };

            res.send(responseBody, 200);
        })
        .catch(function (err) {

            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

exports.uploadFile = function (req, res) {
    logger.info("Upload file...");
    var containerGuid = req.query['container'];
    var fileGuid = jive.util.guid();
    var fileObj = JSON.parse(req.body.metadata);
    var fileDirectory;

    jive.context.persistence.findByID("places", containerGuid)
        .then(function (container) {
            if (container) {
                fileDirectory = container.containerPath + "/" + req.files.file.name;
                return q.fcall(function () {
                });
            }
            else {
                throw new Error("The container was not found");
            }
        })
        .then(function () {
            return jive.util.fsexists(fileDirectory);
        })
        .then(function (exists) {
            if (!exists) {
                return jive.util.fsmkdir(fileDirectory);
            } else {
                return q.fcall(function () {
                });
            }
        })
        .then(function () {
            logger.info("Directory for file " + req.files.file.name + " was created in: " + fileDirectory);
            fileObj.fileDirectoryPath = fileDirectory;
            return handleFileVersion(fileGuid, fileObj, fileObj.version, req.files.file);
        })
        .then(function (responseData) {
            res.send(responseData, 200);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

exports.uploadVersion = function (req, res) {
    logger.info("Upload file version...");
    var fileGuid = req.query.file;
    var versionObj = JSON.parse(req.body.metadata);
    jive.context.persistence.findByID("files", fileGuid)
        .then(function (fileObj) {
            return handleFileVersion(fileGuid, fileObj, versionObj, req.files.file);
        })
        .then(function (responseData) {
            res.send(responseData, 200);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

exports.downloadVersion = function (req, res) {
    var versionGuid = req.query.version;
    logger.info("Download version... " + versionGuid);

    jive.context.persistence.findByID("fileVersions", versionGuid)
        .then(function (versionObj) {
           res.sendfile(versionObj.fileVersionPath);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

exports.deleteContainer = function (req, res) {
    var containerGuid = req.query.container;
    logger.info("Delete container... container id:" + containerGuid);
    jive.context.persistence.findByID("places", containerGuid)
        .then(function (placeObj) {
            if (placeObj) {
                logger.info("Deleting place from persistence...")
                var deletes = [];
                deletes.push(q.fcall(function () {
                    return jive.context.persistence.remove("places", containerGuid);
                }));

                deletes.push(q.fcall(function () {
                    logger.info("Deleting binary files from disk")
                    return jive.util.fsrmdir(placeObj.containerPath);
                }));

                return q.all(deletes);
            }
            else {
                logger.warn("There was no place in the DB with the id " + containerGuid);
                return q.fcall(function () {
                });
            }
        })
        .then(function () {
            res.writeHead(200);
            res.end();
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
}

exports.deleteFile = function (req, res) {
    var fileGuid = req.query.file;

    logger.info("Delete file... file id:" + fileGuid);
    jive.context.persistence.findByID("files", fileGuid)
        .then(function (fileObj) {
            if (fileObj) {
                logger.info("Deleting file version from persistence...")
                var deletes = [];
                for (var versionGuid in fileObj.versionsList) {
                    deletes.push(q.fcall(function () {
                        return jive.context.persistence.remove("fileVersions", versionGuid);
                    }));
                }
                deletes.push(q.fcall(function () {
                    return jive.context.persistence.remove("files", fileGuid);
                }));

                deletes.push(q.fcall(function () {
                    logger.info("Deleting binary files from disk")
                    return jive.util.fsrmdir(fileObj.fileDirectoryPath);
                }));

                return q.all(deletes);
            }
            else {
                logger.warn("There was no file in the DB with the id " + fileGuid);
                return q.fcall(function () {
                });
            }
        })
        .then(function () {
            res.writeHead(200);
            res.end();
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
}

function handleFileVersion(fileGuid, fileObj, versionObj, tempFile) {
    var versionGuid = jive.util.guid();
    if (fileObj.versionsList) {
        fileObj.versionsList.push(versionGuid);
    }
    else {
        fileObj.versionsList = [versionGuid];
    }
    var fileExt = tempFile.name.split('.').pop();
    var fileVersionPath = fileObj.fileDirectoryPath + "/version" + fileObj.versionsList.length + "." + fileExt;
    return jive.util.fsrename(tempFile.path, fileVersionPath)
        .then(function () {
            logger.info("File version binary was saved to: " + fileVersionPath);
            return jive.context.persistence.save("files", fileGuid, fileObj);
        })
        .then(function () {
            versionObj.fileVersionPath = fileVersionPath;
            return jive.context.persistence.save("fileVersions", versionGuid, versionObj);
        })
        .then(function () {
            var version = {
                'contentType': versionObj.contentType,
                'fileName': versionObj.fileName,
                'externalId': versionGuid,
                'size': tempFile.size,
                'resources': [
                    {
                        'name': 'self',
                        'url': '/file-system-storage/version?version=' + versionGuid,
                        'verbs': ['GET', 'PUT', 'DELETE']
                    },
                    {
                        'name': 'downloadVersion',
                        'url': '/file-system-storage/download?version=' + versionGuid,
                        'verbs': ['GET']
                    },
                    {
                        'name': 'fileParent',
                        'url': '/file-system-storage/file?file=' + fileGuid,
                        'verbs': ['GET']
                    }
                ]};

            var responseData = {
                'externalId': fileGuid,
                'version': version,
                'resources': [
                    {
                        'name': 'self',
                        'url': '/file-system-storage/file?file=' + fileGuid,
                        'verbs': ['GET', 'PUT', 'DELETE']
                    },
                    {
                        'name': 'uploadVersion',
                        'url': '/file-system-storage/uploadVersion?file=' + fileGuid,
                        'verbs': ['POST']
                    }
                ]
            };

            return q.fcall(function () {
                return responseData;
            });
        });
};

//exports.task = new jive.tasks.build(
//    // runnable
//    function () {
//        jive.logger.info("A task ran!");
//    },
//
//    // interval (optional)
//    5000
//);
//
//exports.onBootstrap = function (app) {
//    jive.logger.info("This should have run on service bootstrap!");
//};