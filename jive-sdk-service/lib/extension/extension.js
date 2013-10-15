/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var fs = require('fs'),
    q  = require('q'),
    jive  = require('../../api');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// public

exports.find = function() {
    return jive.service.persistence().find( 'jiveExtension', { 'id' : 'jiveExtension' } ).then( function( records ) {
        if ( records && records.length > 0 ) {
            return records[0];
        }
        return null;
    });
};

exports.save = function(record) {
    return jive.service.persistence().save('jiveExtension', 'jiveExtension', record);
};

exports.prepare = function (tilesDir, appsDir, cartridgesDir, storagesDir) {
    var extensionSrcDir = 'extension_src';

    return jive.util.fsexists(extensionSrcDir).then(function( exists ) {
        if ( !exists ) jive.util.fsmkdir( extensionSrcDir)
    }).then( function() {
        return getPersistedExtensionInfo(jive.service.options['extensionInfo'] || {});
    }).then( function(extensionInfo) {
        return jive.util.recursiveCopy( __dirname + "/template", extensionSrcDir, false)
            .then( function() {
                return getTileDefinitions();
            }).then( function(definitions) {
                return setupExtensionDefinitionJson(
                    tilesDir,
                    appsDir,
                    cartridgesDir,
                    storagesDir,
                    extensionSrcDir,
                    extensionInfo,
                    definitions
                ).then( function(definitionsJson) {
                    // persist the extension metadata
                    var meta = fillExtensionMetadata(extensionInfo, definitionsJson);
                    return jive.util.fswrite( JSON.stringify(meta, null, 4), extensionSrcDir  + '/meta.json' );
                });
            });
    }).then( function() {
        // zip it all
        return jive.util.zipFolder( extensionSrcDir, 'extension.zip' );
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// private

function fillExtensionMetadata(extensionInfo, definitions) {

    var description = extensionInfo['description'];
    var name = extensionInfo['name'];
    var type = 'client-app'; // by default
    var id = extensionInfo['uuid'];

    var hasCartridges = definitions['jabCartridges'] && definitions['jabCartridges'].length > 0;
    var hasOsapps = definitions['osapps'] && definitions['osapps'].length > 0;
    var hasTiles = definitions['tiles'] && definitions['tiles'].length > 0;
    var hasTemplates = definitions['templates'] && definitions['templates'].length > 0;

    if ( hasCartridges && (hasOsapps || hasTiles || hasTemplates ) ) {
        throw Error("Extension cannot contain Jive Anywhere cartridges and other types.");
    }

    if ( hasCartridges ) {
        type = 'jab-cartridges-app';
    }

    if (!name) {
        // synthesize a reasonable name
        name = "Add-on containing ";
        var c = [];
        if ( hasCartridges ) {
            c.push('cartridge(s)');
        }
        if ( hasOsapps ) {
            c.push('apps(s)');
        }
        if ( hasTiles ) {
            c.push('tiles(s)');
        }
        name += c.join(', ').trim();
    }

    if (!description) {
        description = '';
        // synthesize a reasonable description
        if ( hasCartridges ) {
            var c = [];
            definitions['jabCartridges'].forEach( function(cartridge) {
                c.push(cartridge['name']);
            });
            description += 'Cartridges: [';
            description += c.join(', ').trim();
            description += '] ';
        }

        if ( hasTiles ) {
            var c = [];
            definitions['tiles'].forEach( function(tile) {
                c.push(tile['name']);
            });
            description += 'Tiles: [';
            description += c.join(', ').trim();
            description += '] ';
        }

        if ( hasOsapps ) {
            var c = [];
            definitions['osapps'].forEach( function(osapp) {
                c.push(osapp['name']);
            });
            description += 'Apps: [';
            description += c.join(', ').trim();
            description += '] ';
        }

        description = description.trim();
        description = description.substring(0, description.length > 255 ? 255 : description.length );
    }

    return {
        "package_version": extensionInfo['packageVersion'] || '1.0',
        "id": id,
        "type": type,
        "name": name,
        "description": description,
        "minimum_version": extensionInfo['minJiveVersion'] || '0000',
        "icon_16": "extension-16.png",
        "icon_48": "extension-48.png",
        "icon_128": "extension-128.png",
        "status": "available",
        "released_on": "2013-03-08T19:11:11.234Z", // xxx todo
        "register_url": jive.service.serviceURL() + "/jive/oauth/register",
        "service_url": jive.service.serviceURL(),
        "redirect_url": extensionInfo['redirectURL'] || jive.service.serviceURL()
    };
}

function getTileDefinitions() {
    var finalizeRequest = function (allDefinitions) {
        var toReturn = [];
        allDefinitions.forEach(function (batch) {
            toReturn = toReturn.concat(batch);
        });
        return q.resolve(jive.service.getExpandedTileDefinitions(toReturn));
    };
    return q.all([ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ]).then(finalizeRequest);
}

function setupExtensionDefinitionJson(tilesDir, appsDir, cartridgesDir, storagesDir, extensionSrcDir, extensionInfo, definitions) {
    return buildTemplates(tilesDir).then(function (templates) {
        return getApps(appsDir, extensionInfo).then(function (apps) {
            return getStorages(storagesDir, extensionInfo).then(function (storages) {
                return getCartridges(cartridgesDir, extensionSrcDir).then(function (cartridges) {

                    jive.logger.debug("apps:\n" + JSON.stringify(apps, null, 4));
                    jive.logger.debug("cartridges:\n" + JSON.stringify(cartridges, null, 4));

                    var definitionsJson = {
                        'integrationUser': {
                            'systemAdmin': extensionInfo['jiveServiceSignature'] ? true : false,
                            'jiveServiceSignature': extensionInfo['jiveServiceSignature']
                        },
                        'tiles': (definitions && definitions.length > 0) ? definitions : undefined,
                        'templates': templates,
                        'osapps': apps,
                        'storageDefinitions': storages,
                        'jabCartridges': cartridges
                    };

                    var definitionJsonPath = extensionSrcDir + '/definition.json';
                    return jive.util.fswrite(JSON.stringify(definitionsJson, null, 4), definitionJsonPath).then( function() {
                        return definitionsJson;
                    })
                });
            });
        });

    });
}

function getStorages(storagesDir, extensionInfo) {
    var storages = [];
    return jive.util.fsexists( storagesDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, storagesDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    var definitionDir = storagesDir + '/' + item + '/definition.json';
                    proms.push( jive.util.fsreadJson(definitionDir).then(function(storage){
                        if ( !storage['name'] ) {
                            // generate a storage name if one is not provided
                            storage['name'] = jive.util.guid(extensionInfo['uuid']);
                        }

                        return storage;
                    }) );
                });
                return q.all(proms);
            });
        } else {
            return storages;
        }
    });
}

function getApps(appsRootDir, extensionInfo) {
    var apps = [];
    return jive.util.fsexists( appsRootDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, appsRootDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    var definitionDir = appsRootDir + '/' + item + '/definition.json';
                    proms.push( jive.util.fsreadJson(definitionDir).then(function(app) {
                        if ( !app['name'] ) {
                            app['name'] = item;
                        }

                        if ( !app['id'] ) {
                            app['id'] = jive.util.guid(app['name'] + extensionInfo['uuid']);
                        }

                        if ( !app['appPath'] ) {
                            // generate an app path if one is not provided
                            var temp = app['id'];
                            temp = temp.replace(/[^a-zA-Z 0-9]+/g,'');
                            app['appPath'] = temp;
                        }

                        app['url'] = jive.service.serviceURL() + '/osapp/' + item + '/app.xml';
                        return app;
                    }) );
                });
                return q.all(proms);
            });
        } else {
            return apps;
        }
    });
}

function getCartridges(cartridgesRootDir, extensionSrcDir) {
    var cartridges = [];
    return jive.util.fsexists( cartridgesRootDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, cartridgesRootDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    var definitionDir = cartridgesRootDir + '/' + item + '/definition.json';
                    var contentDir = cartridgesRootDir + '/' + item + '/content';
                    proms.push( jive.util.fsreadJson(definitionDir).then(function(cartridge) {
                        if ( !cartridge['name'] ) {
                            // generate an cartidge name if one is not provided
                            cartridge['name'] = jive.util.guid();
                        }

                        var zipFileName = cartridge['zipFileName'];
                        if ( !zipFileName ) {
                            zipFileName = cartridge['name'];
                            zipFileName = zipFileName.replace(/[^\S]+/, '');
                            zipFileName = zipFileName.replace(/[^a-zA-Z0-9]/, '-');
                            zipFileName += '.zip';
                        }

                        var zipFile = extensionSrcDir + '/data/' + zipFileName;
                        return jive.util.zipFolder( contentDir, zipFile, true).then( function() {
                                return q.resolve(cartridge);
                        })
                    }) );
                });
                return q.all(proms);
            });
        } else {
            return cartridges;
        }
    });
}

function buildTemplates(tilesDir) {
    var templatesPath = tilesDir + '/templates.json';

    var toTemplateArray = function(templates) {
        if ( !templates ) {
            return null;
        }

        var templateArray = [];
        for (var key in templates) {
            if (templates.hasOwnProperty(key)) {
                templateArray.push(templates[key]);
            }
        }
        return templateArray;
    };

    return jive.util.fsexists(tilesDir).then(function(exists) {
        if ( !exists ) {
            return q.resolve([]);
        } else {
            return jive.service.extensions().find().then(function (extension) {
                return jive.util.fsexists(templatesPath.trim()).then(function (exists) {
                    if (!exists) {
                        // create it
                        return buildDefaultTemplate(extension).then( function(defaultTemplate) {
                            var templates = {};
                            templates['default'] = defaultTemplate;
                            return jive.util.fswrite(JSON.stringify(templates, null, 4), tilesDir + '/templates.json').then( function () {
                                return toTemplateArray(templates);
                            })
                        });
                    } else {
                        // make sure there is a default template
                        return jive.util.fsread(templatesPath).then( function(data) {
                            var templates = JSON.parse( new Buffer(data).toString() );
                            jive.logger.debug(templates);
                            if ( !templates['default'] ) {
                                return buildDefaultTemplate(extension).then( function(defaultTemplate) {
                                    templates['default'] = defaultTemplate;
                                    return jive.util.fswrite(JSON.stringify(templates, null, 4), tilesDir + '/templates.json').then( function() {
                                        return toTemplateArray(templates);
                                    })
                                });
                            } else {
                                return toTemplateArray(templates);
                            }
                        });
                    }
                });
            });
        }
    })
}

function buildDefaultTemplate(extension, existing) {
    return q.all([ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ]).then(
        function (allDefinitions) {
            var tiles = [];
            allDefinitions.forEach(function (batch) {
                batch.forEach(function (b) {
                    tiles.push(b['name']);
                });
            });

            existing = existing || {};
            var extensionName = extension['name'] || extension['uuid'];
            var extensionDescription = extension['description'] || extensionName;

            var defaultTemplate = {
                "name": "defaultTemplate",
                "displayName": extensionName,
                "description": extensionDescription,
                "tiles": tiles
            };

            return defaultTemplate;
        }
    );
}

function getPersistedExtensionInfo(config) {
    return exports.find().then( function( record ) {
        if ( record ) {
            for (var key in config) {
                if (config.hasOwnProperty(key)) {
                    // update
                    if ( !record[key] ) {
                        record[key] = config[key];
                        if ( key == 'uuid') {
                            record[key] = jive.util.guid();
                        }
                    } else if ( config[key] && config[key] !== record[key] ) {
                        record[key] = config[key];
                    }
                }
            }

            return exports.save(record);
        } else {
            // create it
            record = {
                'id' : 'jiveExtension',
                'uuid' : jive.util.guid()
            };

            for (var key in config) {
                if (config.hasOwnProperty(key)) {
                    // update
                    if ( !record[key] ) {
                        record[key] = config[key];
                        if ( key == 'uuid') {
                            record[key] = jive.util.guid();
                        }
                    } else if ( config[key] && config[key] !== record[key] ) {
                        record[key] = config[key];
                    }
                }
            }

            return exports.save(record);
        }
    });
}

