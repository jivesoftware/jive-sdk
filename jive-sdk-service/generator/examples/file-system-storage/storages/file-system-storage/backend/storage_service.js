var jive = require('jive-sdk');
var fs = require('fs');
var q = require('q');


var logger = require('log4js').getLogger('storage-service');

exports.registerPlace = function (req, res) {
    logger.info("Registering place...");

    // TODO: generate AccessToken.

    jive.context.persistence.find("places", { "jiveUrl": req.body.jiveUrl, "containerId": req.body.container.id }).then(function (found) {
        var cotainerGuid = jive.util.guid();

        // If already exists, uses the same cotainerGuid
        if (found) {
            var container;
            if (found == null || found.length < 1) {
                container = null;
            } else {
                // return first one
                container = found[0];
            }

            if (container) {
                cotainerGuid = container.guid;
            }
        }

        req.body.containerId = req.body.container.id;
        req.body.guid = cotainerGuid;
        var containerPath = jive.service.options.rootFolder + cotainerGuid;

        jive.context.persistence.save("places", cotainerGuid, req.body)
            .then(function () {
                return jive.util.fsexists(containerPath);
            }).then(function (exists) {
                if (!exists) {
                    return jive.util.fsmkdir(containerPath);
                } else {
                    return q.fcall(function () {
                    });
                }
            }).then(function () {
                var responseBody = {
                    'externalId': cotainerGuid,
                    'resources': [
                        {
                            'name': 'self',
                            'url': '/file-system-storage/place?containerGuid=' + cotainerGuid,
                            'verbs': ['GET', 'PUT', 'DELETE']
                        },
                        {
                            'name': 'uploadFile',
                            'url': '/file-system-storage/upload?containerGuid=' + cotainerGuid,
                            'verbs': ['POST']
                        }
                    ]
                };

                res.send(responseBody, 200);
            }).catch(function (err) {
                logger.error(err);
                res.writeHead(500);
                res.end();
            });
    });
};

exports.deleteContainer = function (req, res) {
    var containerGuid = req.query.guid;
    logger.info("Delete container... container id:" + containerGuid);
    // TODO: implement

    res.writeHead(200);
    res.end();
}

exports.uploadFile = function (req, res) {
    logger.info("Upload file...\n" + JSON.stringify(req.body, null, 4));
    var containerGuid = req.query['containerGuid'];
    var fileGuid = jive.util.guid();
    var fileDirectory = jive.service.options.rootFolder + containerGuid + "/" + fileGuid;
    jive.util.fsmkdir(fileDirectory)
        .then(function () {
            return jive.util.fsrename(req.files.file.path, fileDirectory + "/1.bin");
        })
        .then(function () {
            return jive.util.fswrite(req.body, fileDirectory + "/1.json");
        })
        .then(function () {
            var version = JSON.parse(req.body.metadata).version;
            version.externalId = fileGuid + "_1";
            version.size = req.files.file.size;
            version.resources = [
                {
                    'name': 'self',
                    'url': '/file-system-storage/version?fileGuid=' + fileGuid + '&version=1',
                    'verbs': ['GET', 'PUT', 'DELETE']
                },
                {
                    'name': 'downloadVersion',
                    'url': '/file-system-storage/download?fileGuid=' + fileGuid + '&version=1',
                    'verbs': ['GET']
                },
                {
                    'name': 'fileParent',
                    'url': '/file-system-storage/file?fileGuid=' + fileGuid,
                    'verbs': ['GET']
                }
            ];
            var responseData = {
                'externalId': fileGuid,
                'version': version,
                'resources': [
                    {
                        'name': 'self',
                        'url': '/file-system-storage/file?fileGuid=' + fileGuid,
                        'verbs': ['GET', 'PUT', 'DELETE']
                    },
                    {
                        'name': 'uploadVersion',
                        'url': '/file-system-storage/uploadVersion?fileGuid=' + fileGuid,
                        'verbs': ['POST']
                    }
                ]
            };
            res.send(responseData, 200);
        })
        .catch(function (err) {
            logger.error(err);
            res.writeHead(500);
            res.end();
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