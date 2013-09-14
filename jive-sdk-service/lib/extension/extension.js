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

exports.prepare = function(tilesDir) {
    var extensionSrcDir = 'extension_src';

    return jive.util.fsexists(extensionSrcDir).then(function( exists ) {
           if ( !exists ) jive.util.fsmkdir( extensionSrcDir)
        }).then( function() {
            return getPersistedExtensionInfo(jive.service.options['extensionInfo'] || {});
        }).then( function(extensionInfo) {
            var meta = {
                "package_version": extensionInfo['packageVersion'] || '1.0',
                "id": extensionInfo['uuid'],
                "type": "client-app",
                "name": extensionInfo['name'] || extensionInfo['uuid'],
                "description": extensionInfo['description'] || extensionInfo['uuid'],
                "minimum_version": extensionInfo['minJiveVersion'] || '0000',
                "status": "available",
                "released_on": "2013-03-08T19:11:11.234Z",
                "register_url": jive.service.serviceURL() + "/jive/oauth/register",
                "service_url": jive.service.serviceURL(),
                "redirect_url": extensionInfo['redirectURL'] || jive.service.serviceURL()
            };
            return jive.util.fswrite( JSON.stringify(meta, null, 4), extensionSrcDir  + '/meta.json' )
                .then( function() {
                    return jive.util.recursiveCopy( __dirname + "/template", extensionSrcDir, false );
                }).then( function() {
                    var finalizeRequest = function(allDefinitions) {
                        var toReturn = [];
                        allDefinitions.forEach( function(batch) { toReturn = toReturn.concat(batch ); });
                        return q.resolve( jive.service.getExpandedTileDefinitions(toReturn) );
                    };
                    return q.all( [ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ] ).then(finalizeRequest);
                }).then( function(definitions) {
                    return buildTemplates(tilesDir).then( function(templates ) {
                        var definitionsJson = {
                            'integrationUser' : {
                                'systemAdmin' : extensionInfo['jiveServiceSignature'] ? true : false,
                                'jiveServiceSignature' : extensionInfo['jiveServiceSignature']
                            },
                            'tiles' : (definitions && definitions.length > 0) ? definitions : undefined,
                            'templates' : templates
                        };

                        return jive.util.fswrite( JSON.stringify(definitionsJson, null, 4), extensionSrcDir  + '/definition.json' );
                    });
                })
        }).then( function() {
            // zip it all
            return jive.util.zipFolder( extensionSrcDir, 'extension.zip' );
        });
};

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

