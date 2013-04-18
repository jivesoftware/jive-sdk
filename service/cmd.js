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
var mustache = require('mustache');

exports.init = function() {
    var tileName = process.argv[2] || 'sampletile';

    var forceAll = process.argv[3] === 'force-all';
    var forceTile = process.argv[3] === 'force-tile';

    console.log('Generating infrastructure to support tile', tileName);
    console.log();

    var targetDir = process.cwd();
    var templateDir = __dirname + '/template';

    var t = function(file) { return targetDir + "/" + file; };
    var s = function(file) { return templateDir + "/" + file };

    var promises = [];

    var conditionalCopy = function(source,target, force) {
        var srcFile = s(source);
        var targetFile = t(target);
        var p = jive.util.fsexists(targetFile).then( function(exists) {
            if ( !exists || force ) {
                return jive.util.fscopy( srcFile, targetFile );
            } else {
                console.log(targetFile,'exists, skipping.');
            }
        });

        promises.push(p);

        return p;
    };

    var conditionalMkdir = function(target, force) {
        var targetDir = t(target);
        var p = jive.util.fsexists(targetDir).then( function(exists) {
            if ( !exists || force ) {
                console.log('Creating', targetDir);
                return jive.util.fsmkdir(targetDir);
            } else {
                console.log(targetDir,'already exists, skipping');
            }
        });

        promises.push(p);

        return p;
    };

    var writeOutTemplateConditional = function( source, target, force ) {
        var targetDir = t(target);

        var p = jive.util.fsexists(targetDir).then( function(exists) {
            if ( !exists || force ){
                console.log('Creating', targetDir);
                jive.util.fsread(s(source)).then( function( data ) {
                    var raw = data.toString();

                    var processed = mustache.render(raw, {
                        TILE_NAME: tileName,
                        'host': '{{{host}}}'
                    });

                    return jive.util.fswrite(processed, t(target));
                });
            } else {
                console.log(targetDir,'already exists, skipping');
            }
        });

        promises.push(p);

        return p;

    };

    // top level
    conditionalCopy('jive_app.js','jive_app.js', forceAll );
    writeOutTemplateConditional( 'package.json', 'package.json', forceAll );
    conditionalCopy('jiveclientconfiguration.json', 'jiveclientconfiguration.json', forceAll );
    conditionalMkdir('tiles', 'tiles', forceAll );
    conditionalMkdir('public', 'public' , forceAll );

    // specific to tile
    conditionalMkdir('tiles/' + tileName , forceAll || forceTile );

    // backend
    conditionalMkdir('tiles/' + tileName + '/backend' , forceAll || forceTile);
    conditionalMkdir('tiles/' + tileName + '/backend/routes' , forceAll || forceTile);
    conditionalMkdir('tiles/' + tileName + '/backend/routes/configure' , forceAll || forceTile);
    writeOutTemplateConditional( 'route_configure.js', 'tiles/' + tileName + '/backend/routes/configure/get.js' , forceAll || forceTile);
    writeOutTemplateConditional( 'definition.json', 'tiles/' + tileName + '/definition.json' , forceAll || forceTile);
    writeOutTemplateConditional( 'services.js', 'tiles/' + tileName + '/backend/services.js' , forceAll || forceTile);

    // public
    conditionalMkdir('/tiles/' + tileName + '/public/javascripts' , forceAll || forceTile);
    conditionalMkdir('/tiles/' + tileName + '/public/stylesheets' , forceAll || forceTile);
    conditionalCopy('main.js',            'tiles/' + tileName + '/public/javascripts/main.js' , forceAll || forceTile);
    writeOutTemplateConditional('main.css',           'tiles/' + tileName + '/public/stylesheets/main.css' , forceAll || forceTile);
    conditionalCopy('configuration.html', 'tiles/' + tileName + '/public/configuration.html', forceAll || forceTile );

    q.all( promises).then(function() {
        console.log('... Done!');
        console.log();

        console.log('Contents of tiles directory (', t('/tiles'), '):' );

        q.nfcall(fs.readdir, t('tiles') ).then(function(dirContents){
            var proms = [];
            dirContents.forEach(function(item) {
                console.log(item);
            });
        }).then( function() {

                console.log("Things you should do now, if you haven't done them already.");
                console.log();
                console.log('(1) Install dependent modules:');
                console.log('   npm update ');
                console.log('(2) Don\'t forget to edit', t('jiveclientconfiguration.json'), 'to specify your clientID, ' +
                    'clientSecret, clientUrl, and other important setup options!');
                console.log();
                console.log('When done, run your service:');
                console.log();
                console.log('   node jive_app.js');
                console.log();

            });

    });
};