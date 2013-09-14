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
var jive = require('../api');

/**
 * jive-sdk create -type
 */

var argv = require('optimist').argv;

var validCommands = ['create','help'];

var styles = [];
var examples = [];

function validate(options) {
    var err = [];

    if ( validCommands.indexOf(options['cmd']) < 0 ) {
        err.push('Invalid comamnd ' + options['cmd'] + ', must be one of ' + validCommands );
    }

    if ( options['cmd'] === 'create' ) {
        if ( styles.concat(examples).indexOf(options['subject']) < 0 &&  options['subject']  != 'all' ) {
            if ( options['subject'] ) {
                err.push('Invalid item ' + options['subject'] + ', must be one of ' + styles.concat(examples) + ", or 'all'.");
            } else {
                err.push('You must create one of ' + styles.concat(examples) + ", or 'all'.");
            }
        }
    }

    return err;
}

var conditionalMkdir = function(target, force) {
    return jive.util.fsexists(target).then( function(exists) {
        if ( !exists || force ) {
            return jive.util.fsmkdir(target);
        } else {
            console.log(target,'already exists, skipping');
            return q.fcall(function(){});
        }
    });
};

function processExample(target, example, name, force) {
    console.log('Preparing example ', example, target );

    var root = __dirname;

    var promises = [];

    // copy base
    promises.push(
        jive.util.recursiveCopy(root + '/base', target, force, {
            'TILE_NAME': example,
            'host': '{{{host}}}'
        } )
    );

    promises.push(
        jive.util.recursiveCopy(root + '/examples/' + example, target, force, {
            'TILE_NAME': name,
            'host': '{{{host}}}'
        } )
    );

    function renameResources(srcRoot, targetRoot) {
        return jive.util.fsexists(srcRoot).then(function (exists) {
            if (exists) {
                return q.all(promises).then(function () {
                    var renamePromises = [];
                    var p = q.nfcall(fs.readdir, srcRoot).then(function (subdirs) {
                        subdirs.forEach(function (subdir) {
                            var src = targetRoot + '/' + subdir;
                            var tar = targetRoot + '/' + name;
                            if (src !== tar) {
                                renamePromises.push(jive.util.fsrename(src, tar, force));
                            }
                        });
                    });
                    return q.all(renamePromises);
                });
            }
            return q.resolve([]);
        });
    }

    return renameResources(root + '/examples/' + example + '/tiles', target + '/tiles').then( function() {
        return renameResources( root + '/examples/' + example + '/apps', target + '/apps');
    });
}

function processDefinition(target, type, name, style, force) {

    console.log('Preparing', type == 'all' ? '' : type,
        '"' + name + '"',
        (type !== 'activity' ? 'of style ' + style : ''));

    var root = __dirname;

    var substitutions = {
        'TILE_NAME': name,
        'TILE_STYLE': style,
        'host': '{{{host}}}'
    };

    var promises = [];

    // copy base
    promises.push(
        jive.util.recursiveCopy(root + '/base', target, force, substitutions )
    );

    promises.push(
        conditionalMkdir(target + '/tiles/' + name, force)
    );

    // copy definition
    promises.push(
        jive.util.recursiveCopy(root + '/definition', target + '/tiles/' + name, force )
    );

    // copy style
    promises.push(
        jive.util.recursiveCopy(
            root + '/styles' + '/' + style,
            target + '/tiles/' + name,
            force, substitutions )
    );

    return q.all(promises);
}

function listDirectory(dirName, dirPath) {
    console.log('Contents of ' + dirName + ' directory (', dirPath, '):\n' );

    return q.nfcall(fs.readdir, dirPath ).then(function(dirContents){
        dirContents.forEach(function(item) {
            console.log(item);
        });
    })
}

function finish(target) {
    var definitionsDir = target + '/tiles';
    var appsDir = target + '/apps';

    var configurationFile =  target + '/jiveclientconfiguration.json';

    console.log('\n... Done!\n');

    // tiles
    jive.util.fsexists(definitionsDir).then( function(exists) {
        if ( exists ) {
            return listDirectory('tiles', definitionsDir);
        } else {
            return q.resolve(true);
        }
    }).then( function() {
        return jive.util.fsexists( appsDir ).then( function(exists) {
            if ( exists ) {
                return listDirectory('apps', appsDir);

            } else {
                return q.resolve();
            }
        });
    }).then( function() {
        console.log("\nThings you should do now, if you haven't done them already.");
        console.log();
        console.log('(1) Install dependent modules:');
        console.log('   npm update ');
        console.log('(2) Don\'t forget to edit', configurationFile, 'to specify your clientID, ' +
            'clientSecret, clientUrl, and other important setup options!');
        console.log();
        console.log('When done, run your service:');
        console.log();
        console.log('   node app.js');
        console.log();
    });
}

function doStyle( options ) {
    var force = options['force'];
    var target = options['target'] || process.cwd();

    var style =  options['subject'];
    var name = options['name'] || 'sample' + style;
    var type = style == 'activity' ? 'activity' : style;
    processDefinition(target, type, name, style, force).then( function() {
        finish(target);
    });
}

function doExample( options ) {
    var force = options['force'];
    var target = options['target'] || process.cwd();

    var example =  options['subject'];
    var name = options['name'] ? options['name'] : example;
    processExample(target, example, name, force).then( function() {
        finish(target);
    });
}

function doAll( options ) {
    var force = options['force'];
    var target = options['target'] || process.cwd();

    var promises = [];
    styles.forEach( function(style) {
        var name = 'sample' + style + (options['name'] ? '-' + options['name'] : '' );
        var type = style == 'activity' ? 'activity' : style;
        promises.push( processDefinition(target, type, name, style, force));
    });

    examples.forEach( function( example ) {
        var name = example + ( options['name'] ? ('-' + options['name'] ) : '');
        promises.push(processExample(target, example, name, force));
    });

    q.all(promises).then( function() {
        var root = __dirname;
        return jive.util.fsTemplateCopy( root + '/base/package.json', target + '/package.json', { 'TILE_NAME': 'jive-examples-all' } )
            .then( function() { return finish(target); });
    });
}

function doHelp() {
    console.log('Usage: jive-sdk [cmd] [item] [--options ...]\n');
    console.log('where cmd include:');
    console.log('   help');
    console.log('   create\n');

    console.log('where item include:');
    examples.concat(styles).forEach( function(item) {
        console.log('   ' + item );
    });

    console.log();
    console.log('where options include:');
    console.log('   --force=<one of [true,false]>           Defaults to false, overrwrites existing if true');
    console.log('   --name=<string>                         Defaults to [item]');
}

function execute(options) {
    var cmd = options['cmd'];

    if ( cmd === 'help' ) {
        doHelp();
    }

    if ( cmd == 'create') {
        var subject = options['subject'];

        if ( subject == 'all' ) {
            doAll( options );
            return;
        }

        if ( styles.indexOf( subject ) > -1 ) {
            doStyle( options );
            return;
        }

        if ( examples.indexOf( subject ) > -1 ) {
            doExample( options );
            return;
        }
    }
}

function prepare() {
    var root = __dirname;

    return jive.util.fsreaddir( root + '/styles').then(function(items) {
        styles = styles.concat( items );
    }).then( function() {
            return jive.util.fsreaddir( root + '/examples').then(function(items) {
                examples = examples.concat( items );
            } );
        });
}

exports.init = function(target) {
    // init lists
    prepare().then( function() {

        // default command to help
        var cmd = argv._.length > 0 ? argv._[0] : 'help';
        var subject = argv._[1];

        var name = argv['name'];
        var force = argv['force'] || false;

        if (name) {
            name = name.replace(/[^\S]+/, '');
            name = name.replace(/[^a-zA-Z0-9]/, '-');
        }

        var options = {
            'name'      : name,
            'cmd'       : cmd,
            'subject'   : subject,
            'force'     : force,
            'target'    : target
        };

        var err = validate(options);
        if ( err.length > 0 ) {
            console.log('Could not execute command, errors were found:');
            err.forEach( function(err) {
                console.log('   ', err);
            });

            console.log();

            doHelp();

            process.exit(-1);
        }

        execute(options);
    });
};
