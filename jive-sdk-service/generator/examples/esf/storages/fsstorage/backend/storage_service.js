var jive = require('jive-sdk');
var fs = require('fs');
var q = require('q');
var logger = require('log4js').getLogger('storage-service');

/**
 * Register Place endpoint
 */
exports.registerPlace = function (req, res) {
    logger.info("Register place...");

    var registerReq = req.body;
    // We create a new folder for the created group.
    // Since this is a sample code we don't handle the case of 2 groups with the same name.
    var containerPath = jive.service.options.rootFolder + "/" + registerReq.container.name;
    var containerGuid = jive.util.guid();

    var tenantId = jive.util.getJiveAuthorizationHeaderValue(req.headers["authorization"],"tenant_id");

    jive.community.requestAccessToken(tenantId, registerReq.oauthCode)
        .then(function (oauthResponse) {
            registerReq.oauth = oauthResponse.entity;
            return jive.util.fsexists(containerPath);
        })
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
            return jive.context.persistence.save("places", containerGuid, registerReq);
        })
        .then(function () {
            var responseBody =
            {
                'externalId': containerGuid,

                //These resources are used by the jive server side to upload data later on to this service.
                //By using to container guid as part of the URL we can later identify where to save the uploaded file.
                'resources': [
                    {
                        'name': 'self',
                        'url': '/fsstorage/place?container=' + containerGuid,
                        'verbs': ['GET', 'PUT', 'DELETE']
                    },
                    {
                        'name': 'uploadFile',
                        'url': '/fsstorage/upload?container=' + containerGuid,
                        'verbs': ['POST']
                    }
                ]
            };

            res.status(200).send(responseBody);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

/**
 * Upload File endpoint
 */
exports.uploadFile = function (req, res) {
    logger.info("Upload file...");

    var containerGuid = req.query['container'];
    var fileGuid = jive.util.guid();
    var fileObj = JSON.parse(req.body.metadata);
    var fileDirectory;

    jive.context.persistence.findByID("places", containerGuid)
        .then(function (container) {
            if (container) {
                fileDirectory = container.containerPath + "/" + req.files[0].originalname;
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
            logger.info("Directory for file " + req.files[0].originalname + " was created in: " + fileDirectory);
            fileObj.fileDirectoryPath = fileDirectory;
            return handleFileVersion(fileGuid, fileObj, fileObj.version, req.files[0]);
        })
        .then(function (responseData) {
            res.status(200).send(responseData);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

/**
 * Upload File Version endpoint
 */
exports.uploadVersion = function (req, res) {
    logger.info("Upload file version...");
    var fileGuid = req.query.file;
    var versionObj = JSON.parse(req.body.metadata);
    jive.context.persistence.findByID("files", fileGuid)
        .then(function (fileObj) {
            return handleFileVersion(fileGuid, fileObj, versionObj, req.files[0]);
        })
        .then(function (responseData) {
            res.status(200).send(responseData);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

/**
 * Download File endpoint
 */
exports.downloadVersion = function (req, res) {
    var versionGuid = req.query.version;
    logger.info("Download version... " + versionGuid);

    jive.context.persistence.findByID("fileVersions", versionGuid)
        .then(function (versionObj) {
            res.sendFile(process.cwd()+"/"+versionObj.fileVersionPath);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
        });
};

exports.updateFile = function (req,res) {
  logger.info("updateFile...");

  var fileGuid = req.query['file'];
  var versionObj = req.body.version;

  jive.context.persistence.findByID("files", fileGuid)
      .then(
        function (fileObj) {
          return handleFileVersion(fileGuid,fileObj,versionObj,null)
      })
      .then(function (responseData) {
          res.status(200).send(responseData);
      });
};

/**
 * Delete Container / Place endpoint
 */
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

/**
 * Delete File endpoint
 */
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

/**
 * Helper function to handle file versioning.
 */
function handleFileVersion(fileGuid, fileObj, versionObj, tempFile) {
    var versionGuid = jive.util.guid();
    if (fileObj.versionsList) {
        fileObj.versionsList.push(versionGuid);
    } else {
        fileObj.versionsList = [versionGuid];
    } // end if

    var firstStep = q.fcall(function () { });
    if (tempFile) {
      var fileExt = tempFile.originalname.split('.').pop();
      var fileVersionPath = fileObj.fileDirectoryPath + "/version" + fileObj.versionsList.length + "." + fileExt;
      firstStep = jive.util.fsrename(tempFile.path, fileVersionPath);
    } // end if

    return firstStep.then(function () {
        if (tempFile) {
          logger.info("File version binary was saved to: " + fileVersionPath);
        } // end if
        return jive.context.persistence.save("files", fileGuid, fileObj);
    }).then(function () {
        versionObj.fileVersionPath = fileVersionPath;
        return jive.context.persistence.save("fileVersions", versionGuid, versionObj);
    }).then(
      function () {
            var version = {
                'contentType': versionObj.contentType,
                'fileName': versionObj.fileName,
                'externalId': versionGuid,
                'resources': [
                    {
                        'name': 'self',
                        'url': '/fsstorage/version?version=' + versionGuid,
                        'verbs': ['GET', 'PUT', 'DELETE'] // PUT method is not implemented in this example
                    },
                    {
                        'name': 'downloadVersion',
                        'url': '/fsstorage/download?version=' + versionGuid,
                        'verbs': ['GET']
                    },
                    {
                        'name': 'fileParent',
                        'url': '/fsstorage/file?file=' + fileGuid,
                        'verbs': ['GET']
                    }
                ]};
                if (tempFile) {
                  version["size"] = tempFile.size;
                } // end if

            var responseData = {
                'externalId': fileGuid,
                'version': version,
                'resources': [
                    {
                        'name': 'self',
                        'url': '/fsstorage/file?file=' + fileGuid,
                        'verbs': ['GET', 'PUT', 'DELETE']
                    },
                    {
                        'name': 'uploadVersion',
                        'url': '/fsstorage/uploadVersion?file=' + fileGuid,
                        'verbs': ['POST']
                    }
                ]
            };

            return q.fcall(function () {
                return responseData;
            });
        });
};

/**
 * Helper function to push file information to Jive.
 */
function pushFileToJive(filePath, filename, place) {
    logger.info("Pushing file " + filePath);
    var fileGuid = jive.util.guid();
    var fileObj = {
        fileDirectoryPath: place.containerPath + "/" + filename
    };
    var versionObj = {
        fileName: filename,
        contentType: 'TBD'
    };

    // Create the ESF REST API url:
    // http://{jive url}/api/core/v3/exstorage/containers/{containerID}/files
    var pushFileUrl = place.jiveUrl + place.containerApiSuffix + "files";

    var tempFile;
    jive.util.fsGetSize(filePath)
        .then(function (size) {
            tempFile = {
                name: filename,
                path: filePath,
                size: size
            };
            return jive.util.fsexists(fileObj.fileDirectoryPath);
        })
        .then(function (exists) {
            if (!exists) {
                return jive.util.fsmkdir(fileObj.fileDirectoryPath);
            } else {
                return q.fcall(function () { });
            }
        })
        .then(function () {
            return handleFileVersion(fileGuid, fileObj, versionObj, tempFile);
        })
        .then(function (reqPayload) {
            var headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + place.oauth.access_token
            };

            // Perform a POST request to upload the file
            return jive.util.buildRequest(pushFileUrl, "POST", reqPayload, headers);
        })
        .then(function () {
            logger.info("done pushing file.")
        })
        .catch(function (err) {
            logger.error(err);
        });
};

/**
 * This function iterates over all folders and looks for files in the /uploads folder
 * of each container that are not uploaded to jive. If it finds files, it will push
 * them to Jive (performed by the pushFileToJive function).
 */
var checkUploadFolder = function() {

    jive.context.persistence.find("places")

        .then(function (places) {

            // Loop through each container / place
            places.forEach(function (place) {
                var uploadFilePath = place.containerPath + "/uploads";

                // Check if the uploads folder exists
                jive.util.fsexists(uploadFilePath)
                    .then(function (exists) {
                        if (!exists) {
                            // If it doesn't exist, create a new folder
                            return jive.util.fsmkdir(uploadFilePath);
                        }
                    })

                    .then(function() {
                        // Read the files in the upload folder
                        return jive.util.fsreaddir(uploadFilePath);;
                    })

                    .then(function (items) {
                        // Loop through each file in the uploads folder
                        items.forEach(function (item) {
                            var path = uploadFilePath + '/' + item;
                            if (item.indexOf('.DS_Store') != 0) {
                                jive.util.fsisdir(path)
                                    .then(function (isDir) {
                                        if (!isDir) {
                                            // Push this file to Jive!
                                            pushFileToJive(path, item, place);
                                        }
                                    });
                            }
                        });
                    });
            });
        });
};

/**
 * Tasks
 */
exports.task = [
    {
        'interval' : 5000,
        'handler'  : checkUploadFolder
    }
];
