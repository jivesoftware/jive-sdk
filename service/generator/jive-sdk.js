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

var fs = require('fs-extra');
var q = require('q');
var path = require('path');
var jive = require('jive-sdk');

/**
 * jive-sdk create -type
 */

var argv = require('optimist').argv;

var validTypes = ['all', 'activity', 'tile' ];
var validCommands = ['create'];
var validTileStyles = ['list', 'gauge', 'table' ];

function validate(options) {
    var err = [];

    if ( validCommands.indexOf(options['cmd']) < 0 ) {
        err.push('Invalid comamnd ' + options['cmd'] + ', must be one of ' + validCommands );
    }

    if ( validTypes.indexOf(options['type']) < 0  ) {
        err.push('Invalid type ' + options['type'] + ', must be one of ' + validTypes );
    }

    if ( options['style'] && validTileStyles.indexOf(options['style']) < 0 && options['type'] !== 'activity' ) {
        err.push('Invalid style ' + options['style'] + ', must be one of ' + validTileStyles );
    }

    return err;
}

function recursiveDirectoryProcessor(currentFsItem, root, targetRoot, force, processor ) {

    var recurseDirectory =  function(directory) {
        return q.nfcall(fs.readdir, directory)
            // process the routes
            .then( function( subItems ) {
                var promises = [];
                subItems.forEach( function( subItem ) {
                    promises.push( recursiveDirectoryProcessor( directory + '/' + subItem, root, targetRoot, force, processor ) );
                });

                return q.all( promises );
            });
    };

    return q.nfcall( fs.stat, currentFsItem ).then( function(stat) {
        var targetPath = targetRoot + '/' +  currentFsItem.substr(root.length + 1, currentFsItem.length );

        if ( stat.isDirectory() ) {
            if ( root !== currentFsItem ) {
                jive.util.fsexists(targetPath).then( function(exists) {
                    if ( !exists ){
                        return processor( 'dir', currentFsItem, targetPath ).then( recurseDirectory(currentFsItem ));
                    }  else {
                        return recurseDirectory(currentFsItem);
                    }
                });
            } else {
                return recurseDirectory(currentFsItem);
            }
        } else if ( stat.isFile() ) {
            jive.util.fsexists(targetPath).then( function(exists) {
                if ( !exists || force ) {
                    return processor( 'file', currentFsItem, targetPath )
                }
            });
        }
    });
}

var conditionalMkdir = function(target, force) {
    return jive.util.fsexists(target).then( function(exists) {
        if ( !exists || force ) {
            return jive.util.fsmkdir(target);
        } else {
            console.log(target,'already exists, skipping');
        }
    });
};

function copyFileProcessor( type, currentFsItem, targetPath, substitutions ) {
    return q.fcall( function() {
        if ( type === 'dir' ) {
            return jive.util.fsmkdir( targetPath );
        }  else {
            // must be file
            return jive.util.fsTemplateCopy( currentFsItem, targetPath, substitutions );
        }
    });
}

function processDefinition(type, name, style, force) {

    console.log('Creating', type == 'all' ? '' : type,
        '"' + name + '"',
        (type !== 'activity' ? 'of style ' + style : ''));

    var root = '../service/generator';
    var target = process.cwd();

    var substitutions = {
        'TILE_NAME': name,
        'host': '{{{host}}}'
    };

    var promises = [];

    var substitutionProcessor = function (type, currentFsItem, targetPath) {
        return copyFileProcessor(type, currentFsItem, targetPath, substitutions);
    };

    // copy base
    promises.push(
        recursiveDirectoryProcessor(
            root + '/base',
            root + '/base',
            target,
            force,
            substitutionProcessor
        )
    );

    promises.push(
        conditionalMkdir(target + '/tiles/' + name)
    );

    // copy definition
    promises.push(
        recursiveDirectoryProcessor(
            root + '/definition',
            root + '/definition',
            target + '/tiles/' + name,
            force,
            copyFileProcessor
        )
    );

    // copy style
    promises.push(
        recursiveDirectoryProcessor(
            root + '/styles' + '/' + style,
            root + '/styles' + '/' + style,
            target + '/tiles/' + name,
            force,
            substitutionProcessor
        )
    );

    return q.all(promises);
}
function execute(options) {
    var type = options['type'];
    var force = options['force'];

    var promises = [];

    if ( type == 'all' ) {

        var styles = [];
        styles = styles.concat(validTileStyles);
        styles.push('activity');

        styles.forEach( function(style) {
            var name = 'sample' + style;
            promise = processDefinition(type, name, style, force);
            promises.push(promise);
        });

    } else {
        var style =  type == 'activity' ? 'activity' : options['style'];
        var name = options['name'] || 'sample' + type;
        var promise = processDefinition(type, name, style, force);
        promises.push(promise);
    }

    q.all(promises).then(function() {
       console.log('Done!');
    });
}

exports.init = function() {
    var cmd = argv._.length > 0 ? argv._[0] : 'create';

    var name = argv['name'];
    var type = argv['type'] || 'tile';
    var style = type == 'activity' ? '': (argv['style'] || 'list');
    var oauth = argv['oauthSupported'] || false;
    var force = argv['force'] || false;

    var options = {
        'name' : name,
        'style'    : style,
        'type'    : type,
        'oauth'    : oauth,
        'cmd'      : cmd,
        'force'    : force
    };

    var err = validate(options);
    if ( err.length > 0 ) {
        console.log('Could not execute command, errors were found:');
        err.forEach( function(err) {
            console.log('   ', err);
        });

        process.exit(-1);
    }

    execute(options);

};
