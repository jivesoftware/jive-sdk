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
                return jive.util.mkdir(targetDir);
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


    // shared infrastructure
    conditionalCopy('jive_app.js','jive_app.js', forceAll );
    writeOutTemplateConditional( 'package.json', 'package.json', forceAll );
    conditionalCopy('jiveclientconfiguration.json', 'jiveclientconfiguration.json', forceAll );
    conditionalMkdir('tiles', 'tiles', forceAll );
    conditionalMkdir('public', 'public' , forceAll );
    conditionalMkdir('public/tiles', 'public/tiles', forceAll );

    // specific to tile
    conditionalMkdir('tiles/' + tileName , forceAll || forceTile );
    conditionalMkdir('tiles/' + tileName + '/routes' , forceAll || forceTile);
    conditionalMkdir('tiles/' + tileName + '/routes/configure' , forceAll || forceTile);
    writeOutTemplateConditional( 'route_configure.js', 'tiles/' + tileName + '/routes/configure/get.js' , forceAll || forceTile);
    writeOutTemplateConditional( 'definition.json', 'tiles/' + tileName + '/definition.json' , forceAll || forceTile);
    writeOutTemplateConditional( 'services.js', 'tiles/' + tileName + '/services.js' , forceAll || forceTile);

    conditionalMkdir('public/tiles/' + tileName , forceAll || forceTile);
    conditionalMkdir('public/tiles/' + tileName + '/javascripts' , forceAll || forceTile);
    conditionalCopy('main.js', 'public/tiles/' + tileName + '/javascripts/main.js' , forceAll || forceTile);
    conditionalMkdir('public/tiles/' + tileName + '/stylesheets' , forceAll || forceTile);
    conditionalCopy('main.js', 'public/tiles/' + tileName + '/stylesheets/main.js' , forceAll || forceTile);
    writeOutTemplateConditional('configuration.html', 'public/tiles/' + tileName + '/configuration.html', forceAll || forceTile );

    q.all( promises).then(function() {
        console.log('... Done!');
        console.log();

        console.log('Contents of tiles directory (', t('public/tiles'), '):' );

        q.nfcall(fs.readdir, t('public/tiles') ).then(function(dirContents){
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