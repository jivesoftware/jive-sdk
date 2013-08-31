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

function getPersistedExtensionInfo(config) {
    return jive.service.persistence().find( 'jiveExtension', { 'id' : 'jiveExtension' } ).then( function( records ) {
        if ( records && records.length > 0 ) {
            var record = records[0];

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

            return jive.service.persistence().save( 'jiveExtension', 'jiveExtension', record);
        } else {
            // create it
            var record = {
                'id' : 'jiveExtension',
                'uuid' : jive.util.guid()
            };

            return jive.service.persistence().save( 'jiveExtension', 'jiveExtension', record);
        }
    });
}

exports.prepare = function() {

    var extensionSrcDir = 'extension_src';
    var config = jive.service.options['extensionInfo'] || {};

    var getExpandedDefinitions = function() {
        var finalizeRequest = function(allDefinitions) {
            var toReturn = [];
            allDefinitions.forEach( function(batch) {
                toReturn = toReturn.concat( batch );
            });

            return q.resolve( jive.service.getExpandedTileDefinitions(toReturn) );
        };

        return q.all( [ jive.tiles.definitions.findAll(), jive.extstreams.definitions.findAll() ] )
            .then( finalizeRequest );
    };

    return getExpandedDefinitions().then( function(defnitions) {
        return getPersistedExtensionInfo(config).then( function( record ) {
            var substitutions = {
                'EXTENSION_UUID' : record['uuid'],
                'EXTENSION_NAME' : record['name'] || record['uuid'],
                'EXTENSION_DESCRIPTION' : record['description'] || record['uuid'],
                'EXTENSION_MIN_JIVE_VERSION' : record['minJiveVersion'] || '0000',
                'REDIRECT_URL' : record['redirectURL'] || jive.service.serviceURL(),
                'HOST' : jive.service.serviceURL(),
                'PACKAGE_VERSION' : record['packageVersion'] || '1.0',
                'TILE_DEFINITIONS' : JSON.stringify( defnitions || [], null, 4)
            };

            return jive.util.fsexists(extensionSrcDir).then( function( exists ) {
                return { 'exists' : exists, substitutions: substitutions };
            });
        }).then( function(result) {
            return result['exists'] ? q.resolve(result['substitutions']) : jive.util.fsmkdir( extensionSrcDir).then( function() {
                return result['substitutions'];
            });
        }).then( function(substitutions) {
            return jive.util.fsTemplateCopy( __dirname + "/template/meta.json", extensionSrcDir  + '/meta.json', substitutions).then( function() {
            return jive.util.fsTemplateCopy( __dirname + "/template/definition.json", extensionSrcDir  + '/definition.json', substitutions); })
        }).then( function() {
            return jive.util.recursiveCopy( __dirname + "/template", extensionSrcDir, false );
        }).then( function() {
           // zip it
            return jive.util.zipFolder( extensionSrcDir, 'aron.zip' );
        });
    });

};