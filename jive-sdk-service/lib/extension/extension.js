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

/**
 * @module extensions
 */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var fs = require('fs'),
    q  = require('q'),
    jive  = require('../../api'),
    _ = require("underscore");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// public

/**
 * @returns {Promise} Promise
 */
exports.find = function() {
    return jive.service.persistence().find( 'jiveExtension', { 'id' : 'jiveExtension' } ).then( function( records ) {
        if ( records && records.length > 0 ) {
            return records[0];
        }
        return null;
    });
};

/**
 * @param record
 * @returns {Promise} Promise
 */
exports.save = function(record) {
    return jive.service.persistence().save('jiveExtension', 'jiveExtension', record);
};

/**
 * @param rootDir
 * @param tilesDir
 * @param appsDir
 * @param cartridgesDir
 * @param storagesDir
 * @param packageApps
 * @returns {Promise} Promise
 */
exports.prepare = function (rootDir, tilesDir, appsDir, cartridgesDir, storagesDir, packageApps) {
    var extensionSrcDir = ( rootDir ? rootDir + '/' : '' ) + 'extension_src';
    var extensionPublicDir = extensionSrcDir + '/public';
    var svrPublicDir = ( rootDir ? rootDir + '/' : '' )  + 'public';
    var extensionZipDir = ( rootDir ? rootDir + '/' : '' ) + 'extension.zip';

    return jive.util.fsexists(extensionSrcDir).then(function( exists ) {
        if ( !exists ) jive.util.fsmkdir( extensionSrcDir)
    }).then( function() {
        if ( packageApps ) {
            // create the public directory if doesn't exist, since we're packaging apps
            return jive.util.fsexists(extensionPublicDir).then( function(exists ) {
                return !exists ? jive.util.fsmkdir( extensionPublicDir) : q.resolve();
            }).then( function() {
                // create the public/apps directory if doesn't exist
                return jive.util.fsexists(svrPublicDir + '/apps').then( function(exists ) {
                    return !exists ? jive.util.fsmkdir( extensionPublicDir + '/apps') : q.resolve();
                })
                    .then( function () {
                        // create the public/tiles directory if doesn't exist
                        return jive.util.fsexists(svrPublicDir + '/tiles').then( function(exists ) {
                            return !exists ? jive.util.fsmkdir( extensionPublicDir + '/tiles') : q.resolve();
                        });
                    })
                    .then( function () {
                        // recursively copy the server's public directory
                        return jive.util.fscopy(svrPublicDir, extensionPublicDir );
                    })
            }).then( function() {
                // copy over the server public directory TODO - should this be configurable? or done based on dependency analysis?
                return jive.util.fsexists(svrPublicDir).then( function(exists ) {
                    return !exists ? jive.util.fsmkdir( extensionPublicDir) : q.resolve();
                }).then( function () {
                    return jive.util.fscopy(svrPublicDir, extensionPublicDir );
                })
            });
        } else {
            // destroy the extension public directory if it exists since we're not packaging apps
            return jive.util.fsexists(extensionPublicDir).then( function(exists ) {
                return exists ? jive.util.fsrmdir( extensionPublicDir) : q.resolve();
            });
        }
    }).then( function() {
        return getPersistedExtensionInfo(jive.service.options['extensionInfo'] || {});
    }).then( function(extensionInfo) {
        return jive.util.recursiveCopy( __dirname + "/template", extensionSrcDir)
            .then( function() {
                return getTileDefinitions(extensionPublicDir, tilesDir, packageApps);
            }).then( function(definitions) {
                return setupExtensionDefinitionJson(
                    tilesDir,
                    appsDir,
                    cartridgesDir,
                    storagesDir,
                    extensionSrcDir,
                    extensionPublicDir,
                    extensionInfo,
                    definitions,
                    packageApps
                ).then( function(definitionsJson) {
                        // persist the extension metadata
                        return getCartridges(cartridgesDir, extensionSrcDir).then(function (cartridges) {
                            var meta = fillExtensionMetadata(extensionInfo, definitionsJson, packageApps, cartridges);
                            var stringifiedMeta = JSON.stringify(meta, null, 4);
                            jive.logger.debug("Extension meta: \n" + stringifiedMeta);
                            return jive.util.fswrite( stringifiedMeta, extensionSrcDir  + '/meta.json' );
                        })

                    });
            });
    }).then( function() {
        // zip it all
        return jive.util.zipFolder( extensionSrcDir, extensionZipDir );
    }).catch( function(e) {
        var error = new Error(e);
        var stack = error.stack;
        jive.logger.error( stack );
        throw error;
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// private

function isValid(file ) {
    return !(file.indexOf('.') == 0)
}

function limit(str, chars) {
    return str.substring(0, str.length > chars ? chars : str.length );
}

function cartridgeIsNotConfigured(type) {
    return type != 'jab-cartridges-app';
}
function fillExtensionMetadata(extensionInfo, definitions, packageApps, cartridges) {

    var description = extensionInfo['description'];
    var name = extensionInfo['name'];
    var type = extensionInfo['type'] || 'client-app'; // by default
    var id = extensionInfo['uuid'];

    var hasCartridges = cartridges && cartridges.length > 0;
    var hasOsapps = definitions['osapps'] && definitions['osapps'].length > 0;
    var hasTiles = definitions['tiles'] && definitions['tiles'].length > 0;
    var hasTemplates = definitions['templates'] && definitions['templates'].length > 0;

    if (hasCartridges && cartridgeIsNotConfigured(type)) {
        jive.logger.warn('***********************\n' +
            'This add-on contains cartridges,  ' +
            'but it is not configured to package them. '+
            'To enable this, add "type": "jab-cartridges-app" ' +
            'to the extensionInfo field of jiveclientconfiguration.json\n' +
            '**********************');
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
            var jabCartridges = definitions['jabCartridges'];
            if ( jabCartridges ) {
                jabCartridges.forEach( function(cartridge) {
                    c.push(cartridge['name']);
                });
                description += 'Cartridges: [';
                description += c.join(', ').trim();
                description += '] ';
            }
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
        description = limit(description, 255);
    }

    var defaultMinimumVersion = '0070300000';
    if ( packageApps ) {
        // minimum version is 8c4
        defaultMinimumVersion = '0080300000';
    }

    var extensionMeta = _.defaults({
        "package_version": extensionInfo['packageVersion'] || '1.0',
        "id": id,
        "type": type,
        "name": name,
        "description": description,
        "minimum_version": extensionInfo['minJiveVersion'] || defaultMinimumVersion,
        "icon_16": extensionInfo['icon16'] || "extension-16.png",
        "icon_48": extensionInfo['icon48'] || "extension-48.png",
        "icon_128": extensionInfo['icon128'] || "extension-128.png",
        "released_on": extensionInfo['releasedOn'] || "2013-03-08T19:11:11.234Z",
        "register_url": extensionInfo['registerURL'] || "%serviceURL%/jive/oauth/register",
        "unregister_url": extensionInfo['unregisterURL'] || "%serviceURL%/jive/oauth/unregister",
        "service_url": jive.service.serviceURL(),
        "redirect_url": extensionInfo['redirectURL'] || "%serviceURL%"
    }, jive.service.options['extensionInfo']);

    // these should never be there
    delete extensionMeta['uuid'];
    delete extensionMeta['jiveServiceSignature'];

    // suppress the register and unregister URLs if configured to do so
    if ( jive.service.options['suppressAddonRegistration'] == true ) {
        delete extensionMeta['register_url'];
        delete extensionMeta['unregister_url'];
    }

    return extensionMeta;
}

function getTileDefinitions(extensionPublicDir, tilesRootDir, packageApps) {
    var finalizeRequest = function (allDefinitions) {
        var toReturn = [];
        allDefinitions.forEach(function (batch) {
            toReturn = toReturn.concat(batch);
        });
        return q.resolve(jive.service.getExpandedTileDefinitions(toReturn));
    };
    return q.all([ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ]).then(finalizeRequest)
        .then( function(definitions) {
            if ( !packageApps) {
                definitions.forEach( function(definition) {
                    delete definition['id'];
                    delete definition['definitionDirName'];
                });
                return definitions;
            } else {
                var proms = [];
                var host = jive.service.serviceURL();
                definitions.forEach( function(definition) {
                    var name = definition['name'];
                    var view = definition['view'];
                    var action = definition['action'];
                    var config = definition['config'];

                    delete definition['id'];
                    definition['view'] = !view ? view : view.replace(host, '/public/tiles');
                    definition['action'] = !action ? action : action.replace(host, '/public/tiles');
                    definition['config'] = !config ? config : config.replace(host, '/public/tiles');
                    delete definition['definitionDirName'];

                    // post-process
                    var tileDir = tilesRootDir + '/' + name;

                    var copyTileDirToPublic = function(tile) {
                        return packageApps ? jive.util.fscopy(tileDir + '/public', extensionPublicDir + '/tiles/' + name).then( function() {
                            return sanitizeReferences(extensionPublicDir, extensionPublicDir + '/tiles/' + name, '/' + name + '/' )(tile);
                        }) : q.resolve(tile);
                    };

                    proms.push( copyTileDirToPublic(definition) );
                });

                return q.all(proms).then( function() {
                    return definitions;
                });
            }
        });
}

function setupExtensionDefinitionJson(tilesDir, appsDir, cartridgesDir, storagesDir, extensionSrcDir, extensionPublicDir,
                                      extensionInfo, definitions, packageApps) {
    return getTemplates(tilesDir).then(function (templates) {
        return getApps(appsDir, extensionPublicDir, extensionInfo, packageApps).then(function (apps) {
            return getStorages(storagesDir, extensionInfo).then(function (storages) {
                return getCartridges(cartridgesDir, extensionSrcDir).then(function (cartridges) {


                    if(cartridgeIsNotConfigured(extensionInfo["type"])){
                        cartridges = [];
                    }
                    cartridges.forEach(function (cartridge) {
                        cartridge.zipUp().then(function () {
                            delete cartridge.zipUp;
                        });
                    });

                    // Remove a config element with "__jive_none__"
                    // definitions.forEach(function(item) {
                    //     if (item['config'] && item['config'].indexOf('__jive_none__') >= 0) {
                    //         delete item['config'];
                    //     }
                    // });

                    jive.logger.debug("apps:\n" + JSON.stringify(apps, null, 4));
                    jive.logger.debug("packaged cartridges:\n" + JSON.stringify(cartridges, null, 4));

                    var definitionsJson = {
                        'integrationUser': {
                            'systemAdmin': extensionInfo['jiveServiceSignature'] ? true : false,
                            'jiveServiceSignature': extensionInfo['jiveServiceSignature'],
                            'runAsStrategy': extensionInfo['runAsStrategy']
                        },
                        'tiles': (definitions && definitions.length > 0) ? definitions : undefined,
                        'templates': (templates && templates.length > 0) ? templates : undefined,
                        'osapps': (apps && apps.length > 0) ? apps : undefined,
                        'storageDefinitions':(storages && storages.length > 0) ? storages : undefined,
                        'jabCartridges': cartridges
                    };

                    // Remove cartridge element if empty
                    if (cartridges == null || cartridges.length == 0) {
                        delete definitionsJson.jabCartridges;
                    }

                    var definitionJsonPath = extensionSrcDir + '/definition.json';
                    var stringifiedDefinitionJson = JSON.stringify(definitionsJson, null, 4);
                    return jive.util.fswrite(stringifiedDefinitionJson, definitionJsonPath).then( function() {
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
                    if ( isValid(item) ) {
                        var definitionDir = storagesDir + '/' + item + '/definition.json';
                        proms.push( jive.util.fsreadJson(definitionDir).then(function(storage){
                            if ( !storage['name'] ) {
                                // generate a storage name if one is not provided
                                storage['name'] = jive.util.guid(extensionInfo['uuid']);
                            }

                            return storage;
                        }) );
                    }
                });
                return q.all(proms);
            });
        } else {
            return storages;
        }
    });
}

function isDirectory(path){
    return fs.statSync(path).isDirectory();
}

var truncateTagSrc = function(html, toTruncate) {
    var fn = function(all, tag, attrString) {
        var matchAttr = /(\w+)\s*=\s*"(.*?)"/g;
        var lookFor = (tag == "a" || tag == 'link') ? "href" : "src";
        var newAttrs = attrString.replace(matchAttr, function(oneAttr, name, value, offset) {
            if (name == lookFor && value.indexOf(toTruncate) == 0) {
                oneAttr = oneAttr.replace('"' + toTruncate, '"');
            }
            return oneAttr;
        });
        return all.replace(attrString, newAttrs);
    };

    var re = /<(script|img|a|link)\s+(.*?)\/?>/gi;
    return html.replace(re, fn);
};

function sanitizeReferences(extensionPublicDir, dirToProcess, tagValueToTruncate) {
    var processOneFile = function(target) {
        var deferred = q.defer();
        var t = target.replace( 'public' + '/', '');
        var depth = (t.split("/").length - 1);
        var publicReplacement = '';
        for ( var i = 0; i < depth; i++ ) {
            publicReplacement += '../';
        }

        jive.util.fsread( extensionPublicDir + '/' + t).then( function(data) {
            var raw = data.toString();
            var processed = raw.replace(/\/__public__\//g, publicReplacement);
            if ( tagValueToTruncate ) {
                processed = truncateTagSrc(processed, tagValueToTruncate);
            }

            jive.util.fswrite( processed, extensionPublicDir + '/' + t).then( function() {
                deferred.resolve();
            });
        });

        return deferred.promise;
    };

    return function(app) {
        return jive.util.recursiveDirectoryProcessor(dirToProcess, dirToProcess, '/tmp', true,function (type, currentFsItem) {
            return q.fcall(function () {
                var proms = [];
                var lowercased = currentFsItem.toLowerCase();
                var ext = lowercased.substring(currentFsItem.lastIndexOf('.') + 1, lowercased.length);
                var validType = ext === 'xml'  || ext === 'html' || ext === 'css' || ext === 'js';
                if (type === 'file' && validType) {
                    var target = currentFsItem.substring(currentFsItem.indexOf('/') + 1, currentFsItem.length);
                    proms.push(processOneFile(target));
                }
                return q.all(proms);
            })
        }).then(function () {
            return q.resolve(app);
        });
    };
}

function getApps(appsRootDir, extensionPublicDir, extensionInfo, packageApps) {
    var apps = [];
    return jive.util.fsexists( appsRootDir).then( function(exists) {
        if ( exists ) {
            return q.nfcall(fs.readdir, appsRootDir).then(function(dirContents){
                var proms = [];
                dirContents.forEach(function(item) {
                    var appDir = appsRootDir + '/' + item;
                    if ( isDirectory(appDir) ) {

                        var copyAppDirToPublic = function(app) {
                            return packageApps ? jive.util.fscopy(appDir + '/public', extensionPublicDir + '/apps/' + item).then( function() {
                                return sanitizeReferences(extensionPublicDir, extensionPublicDir + '/apps/' + item )(app);
                            }) : q.resolve(app);
                        };

                        var definitionDir = appDir + '/definition.json';
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

                            if ( packageApps ) {
                                app['url'] = '/public/apps/' + item  + '/app.xml';
                            } else {
                                app['url'] = '%serviceURL%/osapp/' + item + '/app.xml';
                            }

                            return copyAppDirToPublic(app);
                        }) );
                    }
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
                    var appDir = cartridgesRootDir + '/' + item;
                    if ( isDirectory(appDir) ) {
                        var definitionDir = appDir + '/definition.json';
                        var contentDir = cartridgesRootDir + '/' + item + '/content';
                        proms.push( jive.util.fsreadJson(definitionDir).then(function(cartridge) {
                            if ( !cartridge['name'] ) {
                                // generate an cartidge name if one is not provided
                                cartridge['name'] = jive.util.guid(item);
                            }

                            cartridge.zipUp = function(){
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
                                });
                            };
                            return cartridge;
                        }) );
                    }
                });
                return q.all(proms);
            });
        } else {
            return cartridges;
        }
    });
}

function getTemplates(tilesDir) {
    var templatesPath = tilesDir + '/templates.json';

    var toTemplateArray = function(allDefinitions, templates) {
        if ( !allDefinitions || allDefinitions.length < 1) {
            return null;
        }

        if ( !templates ) {
            return null;
        }

        var templateArray = [];
        for (var key in templates) {
            if (templates.hasOwnProperty(key)) {
                var template = templates[key];
                var templateTiles = template['tiles'];
                var filteredTiles = [];
                if ( templateTiles ) {
                    templateTiles.forEach( function(tileName) {
                        if ( allDefinitions.indexOf(tileName) > -1 ) {
                            filteredTiles.push(tileName);
                        }
                    });
                }
                template['tiles'] = filteredTiles;
                templateArray.push(template);
            }
        }
        return templateArray;
    };

    return getAllDefinitions().then( function(allDefinitions) {
        return jive.util.fsexists(tilesDir).then(function(exists) {
            if ( !exists ) {
                return q.resolve([]);
            } else {
                return jive.service.extensions().find().then(function (extension) {
                    return jive.util.fsexists(templatesPath.trim()).then(function (exists) {
                        if (!exists) {
                            // create it
                            return buildDefaultTemplate(allDefinitions, extension).then( function(defaultTemplate) {
                                var templates = {};
                                templates['default'] = defaultTemplate;
                                return jive.util.fswrite(JSON.stringify(templates, null, 4), tilesDir + '/templates.json').then( function () {
                                    return toTemplateArray(allDefinitions, templates);
                                })
                            });
                        } else {
                            // make sure there is a default template
                            return jive.util.fsread(templatesPath).then( function(data) {
                                var templates = JSON.parse( new Buffer(data).toString() );
                                jive.logger.debug(templates);
                                if ( !templates['default'] ) {
                                    return buildDefaultTemplate(allDefinitions, extension).then( function(defaultTemplate) {
                                        templates['default'] = defaultTemplate;
                                        return jive.util.fswrite(JSON.stringify(templates, null, 4), tilesDir + '/templates.json').then( function() {
                                            return toTemplateArray(allDefinitions, templates);
                                        })
                                    });
                                } else {
                                    return toTemplateArray(allDefinitions, templates);
                                }
                            });
                        }
                    });
                });
            }
        })
    });
}

function getAllDefinitions() {
    return q.all([ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ]).then(
        function (allDefinitions) {
            var tiles = [];
            allDefinitions.forEach(function (batch) {
                batch.forEach(function (b) {
                    tiles.push(b['name']);
                });
            });

            return tiles;
        });
}

function buildDefaultTemplate(allDefinitions, extension) {
    var extensionName = extension['name'];
    var extensionDescription = extension['description'];

    if ( !extensionName ) {
        if ( allDefinitions ) {
            var c = [];
            extensionName = '';
            extensionName += 'Contains: [';
            extensionName += allDefinitions.join(', ').trim();
            extensionName += '] ';

            extensionName = limit(extensionName, 127);
        } else {
            extensionName = extension['uuid'];
        }
    }

    if ( !extensionDescription ) {
        extensionDescription = 'Extension UUID ' + extension['uuid'] + ' ' + extensionName;
    }

    var defaultTemplate = {
        "name": "defaultTemplate",
        "displayName": extensionName,
        "description": extensionDescription,
        "tiles": allDefinitions
    };

    return q.resolve( defaultTemplate );
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

