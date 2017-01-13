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
var _ = require("underscore");

var ADD_ON_GUID = jive.util.guid();
var APP_GUID = jive.util.guid();
var APP2_GUID = jive.util.guid();
var APP3_GUID = jive.util.guid();
var APP4_GUID = jive.util.guid();
var APP5_GUID = jive.util.guid();

/**
 * jive-sdk create -type
 */

var argv = require('minimist')(process.argv.slice(2));

var validCommands = ['create','help','list', 'createExtension', 'build', 'version', 'unpack'];
var groups = ['tiles', 'apps', 'services', 'storages', 'cartridges', 'examples'];

var styles = [];
var examples = [];

var deprecatedNames = ['tile-activity', 'example-filestorage', 'list',      'gauge',      'gallery',      'table',      'activity',      'github',         'sfdc',               'bitcoin',         'todo',         'auth',         'basecamp',         'jenkins',         'jira',         'newrelic',         'podio',         'stock-price',         'wikibang',         'sampleapps',         'samplegoogle',         'albums',         'samplewebhooks',   'analytics',         'sampleservice',   'samplecartridges',   'sampleFilesStorage'];
var refactoredNames = ['activity-stream', 'esf', 'tile-list', 'tile-gauge', 'tile-gallery', 'tile-table', 'activity-stream', 'example-github', 'example-salesforce', 'example-bitcoin', 'example-todo', 'example-auth', 'example-basecamp', 'example-jenkins', 'example-jira', 'example-newrelic', 'example-podio', 'example-stockprice', 'example-wikibang', 'example-sampleapps', 'example-samplegoogle', 'example-albums', 'example-webhooks', 'example-analytics', 'service', 'example-cartridges', 'esf'];

// Add descriptions for all template items here.
// If you don't add a description here, the help output will
// not have a description for that template...
// Examples are not described -- just template items.
var itemDescriptions = {
    'app' : 'A basic Jive app',
    'app-ext-object' : 'A basic example that uses simple stream integrations and Jive app external objects',
    'esf' : 'An external storage framework that uses a file system',
    'activity-stream': 'A basic activity stream',
    'simple-stream': 'A boiler plate example using the simple stream framework with a bundled ext-object app example',
    'oauth2-client': 'A quick project for creating OAuth2 client add-ons',
    'cartridge' : 'A basic cartridge',
    'tile-list' : 'A basic list tile',
    'tile-table': 'A basic table tile',
    'tile-gallery': 'A basic gallery tile',
    'tile-carousel': 'A basic carousel tile',
    'tile-gauge': 'A basic gauge tile',
    'tile-sectionlist': 'A basic sectionlist (aka accordion) tile',
    'tile-app-simple' : 'A basic custom view tile (Jive-hosted)',
    'tile-app-internal' : 'A custom view tile with configuration (Jive-hosted)',
    'tile-app-external' : 'An external custom view tile',
    'tile-app-action' : 'A custom view tile with a tile action (Jive-hosted)',
    'service' : 'A basic service'
};

var groupedExamples = {};
_.each(groups, function(group) { groupedExamples[group] = [] });


function validate(options) {
    var err = [];

    if ( validCommands.indexOf(options['cmd']) < 0 ) {
        err.push('Invalid command ' + options['cmd'] + '.\nMust be one of ' + validCommands );
    }

    if ( options['cmd'] === 'create' ) {
        if ( styles.concat(examples).concat(deprecatedNames).indexOf(options['subject']) < 0 &&  options['subject']  != 'all' ) {
            if ( options['subject'] ) {
                err.push('Invalid item ' + options['subject'] + '.\nMust be one of ' + styles.concat(examples) + ", or 'all'.");
            } else {
                err.push('You must create one of ' + styles.concat(examples) + ", or 'all'.");
            }
        }
    }

    if ( options.cmd === 'list' ) {
        if( options.subject ) {
            if(groups.indexOf( options.subject ) == -1) {
                err.push('Invalid list type ' + options.subject + '.\nMust be one of ' + groups + ", empty, or 'all'");
            }
        }
    }

    if ( options.cmd === 'unpack' ) {
        if( options['subject'] ) {
    		jive.util.fsexists(options.subject)
			.then( function(exists) {
				if (!exists) {
					err.push('Invalid Filename ' + options.subject + ' File Not Found');
				} else {
					//TODO: VALIDATE THAT THE FILE IS A VALID ADD-ON
				} // end if
			});
        } else {
    		err.push('Missing Add-On Filename Option');
		} // end if
    } // end if

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

function mergeRecursive(original, newcommer) {

    for (var p in newcommer) {
        try {
            if ( newcommer[p].constructor==Object ) {
                original[p] = mergeRecursive(original[p], newcommer[p]);

            } else {
                if ( !original[p] )
                    original[p] = newcommer[p];
            }

        } catch(e) {
            original[p] = newcommer[p];

        }
    }
    return original;
}

function processExample(target, example, name, force, authorizeUrl) {
    console.log('Preparing example ', name, target );

    var customName = name !== example;
    var tilePrefix = customName ? name  + '_' : '';

    var root = __dirname;

    var processSubRootFolder = function( sourceSubRoot, targetSubRoot, doSubstitutions ){
        return jive.util.fsexists(targetSubRoot).then( function(exists) {
            return !exists ? jive.util.fsmkdir(targetSubRoot) : q.resolve();
        }).then( function() {
            if ( sourceSubRoot.indexOf("public") > -1 ) {
                return jive.util.recursiveCopy(sourceSubRoot, targetSubRoot, force, !doSubstitutions ? undefined : {
                    'TILE_PREFIX': tilePrefix,
                    'TILE_NAME_BASE' : name,
                    'TILE_NAME': name,
                    'NAME': name,
                    'GENERATED_UUID' : ADD_ON_GUID,
                    'GENERATED_APP_UUID' : APP_GUID,
                    'GENERATED_APP2_UUID' : APP2_GUID,
                    'GENERATED_APP3_UUID' : APP3_GUID,
                    'OAUTH_AUTHORIZE_URL' : authorizeUrl ? authorizeUrl : 'REPLACE_ME_WITH_OAUTH_AUTHORIZE_URL',
                    'TIMESTAMP' : new Date().toISOString(),
                    'host': '{{{host}}}'
                } );
            } else {
                return jive.util.fsreaddir(sourceSubRoot).then( function(subDirs) {
                    var promises = [];
                    if ( subDirs && subDirs['forEach'] ) {
                        subDirs.forEach(function(subDir) {
                        	targetSubRoot
                            var sourceSubRootEntry = sourceSubRoot + '/' + subDir;
                            var tileName;
                            if ( customName ) {
                                tileName = subDirs.length > 1 ? name + '_' + subDir : name;
                            } else {
                                tileName = subDir;
                            }

                            var targetSubRootEntry = targetSubRoot + '/' + tileName;

                            /*** SPECIAL BEHAVIOR FOR AN IMPORTANT PACKAGING DIRECTORY ***/
                            if (targetSubRoot.indexOf('/extension_src') > 0) {
                            	targetSubRootEntry = targetSubRoot + '/' +subDir;
                            } // end if

                            var substitutions = !doSubstitutions ? undefined : {
                                'TILE_PREFIX': tilePrefix,
                                'TILE_NAME_BASE' : name,
                                'TILE_NAME': tileName,
                                'NAME': name,
                                'GENERATED_UUID' : ADD_ON_GUID,
                                'GENERATED_APP_UUID' : APP_GUID,
                                'GENERATED_APP2_UUID' : APP2_GUID,
                                'GENERATED_APP3_UUID' : APP3_GUID,
                                'OAUTH_AUTHORIZE_URL' : authorizeUrl ? authorizeUrl : 'REPLACE_ME_WITH_OAUTH_AUTHORIZE_URL',
                                'TIMESTAMP' : new Date().toISOString(),
                                'host': '{{{host}}}'
                            };

                        	promises.push(
                        			conditionalMkdir(targetSubRootEntry,true)
                        	);

                            promises.push(
                                jive.util.recursiveCopy(sourceSubRootEntry, targetSubRootEntry, force, substitutions )
                            );
                        });
                    }
                    return q.all(promises);
                });
            }
        });
    };

    var processSubRootFile = function(sourceSubRoot, targetSubRoot, baseSubstitutions, force) {
        return jive.util.fsexists(targetSubRoot).then(function (exists) {
            if (!exists || force === 'true') {
                return jive.util.fsTemplateCopy(sourceSubRoot, targetSubRoot, baseSubstitutions);
            } else {
                if (!force) {
                    // it exists, but force is not specified; try to merge if .json object
                    var extension = path.extname(sourceSubRoot);
                    if (extension && extension.toLowerCase() === '.json') {
                        return jive.util.fsreadJson(targetSubRoot).then(function (originJson) {
                            return jive.util.fsreadJson(sourceSubRoot).then(function (incomingJson) {
                                var mergedTxt = JSON.stringify(mergeRecursive(originJson, incomingJson), null, 4);
                                return jive.util.fsTemplateWrite(mergedTxt, targetSubRoot, baseSubstitutions);
                            });
                        });
                    }
                }

                return q.resolve();
            }
        });
    };

    var baseSubstitutions = {
        'TILE_PREFIX': tilePrefix,
        'TILE_NAME_BASE': name,
        'NAME': name,
        'GENERATED_UUID' : ADD_ON_GUID,
        'GENERATED_APP_UUID' : APP_GUID,
        'GENERATED_APP2_UUID' : APP2_GUID,
        'GENERATED_APP3_UUID' : APP3_GUID,
        'OAUTH_AUTHORIZE_URL' : authorizeUrl ? authorizeUrl : 'REPLACE_ME_WITH_OAUTH_AUTHORIZE_URL',
        'TIMESTAMP' : new Date().toISOString(),
        'host': '{{{host}}}'
    };

    return jive.util.recursiveCopy(root + '/base', target, force, baseSubstitutions).then( function() {
        var promises = [];
        var sourceRootDir = root + '/examples/' + example;
        return jive.util.fsreaddir(sourceRootDir).then( function(subDirs) {
            subDirs.forEach(function(subDir) {
                var sourceSubRoot = sourceRootDir + '/' + subDir;
                var targetSubRoot = target + '/' + subDir;
                promises.push( jive.util.fsisdir(sourceSubRoot).then( function(isDir) {
                    if ( isDir ) {
                        var doSubstitutions = subDir != 'cartridges';   // don't do substitutions on cartridges
                        return processSubRootFolder( sourceSubRoot, targetSubRoot, doSubstitutions );
                    } else {
                        return processSubRootFile( sourceSubRoot, targetSubRoot, baseSubstitutions, force );
                    }
                }) );
            });
            return q.all(promises);
        });
    })
}

function processDefinition(target, type, name, style, force, authorizeUrl) {

    console.log('Preparing', type == 'all' ? '' : type,
        '"' + name + '"',
        (type !== 'activity' ? 'of style ' + style : ''));

    var root = __dirname;

    var substitutions = {
        'TILE_NAME': name,
        'TILE_STYLE': style,
        'NAME': name,
        'GENERATED_UUID' : ADD_ON_GUID,
        'GENERATED_APP_UUID' : APP_GUID,
        'GENERATED_APP2_UUID' : APP2_GUID,
        'GENERATED_APP3_UUID' : APP3_GUID,
        'OAUTH_AUTHORIZE_URL' : authorizeUrl ? authorizeUrl : 'REPLACE_ME_WITH_OAUTH_AUTHORIZE_URL',
        'TIMESTAMP' : new Date().toISOString(),
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
        jive.util.recursiveCopy(root + '/definition', target + '/tiles/' + name, force ).then(

        // post process definition
        function() {
            var definitionJsonPath = target + '/tiles/' + name + '/definition.json';
            return jive.util.fsreadJson(definitionJsonPath ).then( function(json) {
                var config = json['config'];
                if ( config && config === '__jive_none__' ) {
                    // 1. remove the directive
                    delete json['config'];

                    // 2. rewrite the definition
                    return jive.util.fswrite(JSON.stringify(json, null, 4), definitionJsonPath).then( function() {
                        // 3. destroy autowired route
                        var path = target + '/tiles/' + name + '/backend/routes/configure/get.js';
                        return jive.util.fsdelete(path);
                    })
                } else {
                    return q.resolve();
                }
            })
        })
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

function listDirectory(dirName, dirPath, excludes) {
    console.log('\nContents of ' + dirName + ' directory (', dirPath, '):\n' );

    return q.nfcall(fs.readdir, dirPath ).then(function(dirContents){
        dirContents.forEach(function(item) {
            if ( !excludes || excludes.indexOf(item) < 0 ) {
                console.log(item);
            }
        });
    })
}

function finish(target,options) {
    var definitionsDir = target + '/tiles';
    var appsDir = target + '/apps';
    var servicesDir = target + '/services';
    var storagesDir = target + '/storages';
    var cartridgesDir = target + '/cartridges';

    var configurationFile =  target + '/jiveclientconfiguration.json';

    console.log('\n... Done!\n');

    // tiles
    jive.util.fsexists(definitionsDir).then( function(exists) {
        if ( exists ) {
            return listDirectory('tiles', definitionsDir, ['templates.json', 'package.json'] );
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
        return jive.util.fsexists( cartridgesDir ).then( function(exists) {
            if ( exists ) {
                return listDirectory('cartridges', cartridgesDir);

            } else {
                return q.resolve();
            }
        });
    }).then( function() {
        return jive.util.fsexists( servicesDir ).then( function(exists) {
            if ( exists ) {
                return listDirectory('services', servicesDir);

            } else {
                return q.resolve();
            }
        });
    }).then( function() {
        return jive.util.fsexists( storagesDir ).then( function(exists) {
            if ( exists ) {
                return listDirectory('storages', storagesDir);

            } else {
                return q.resolve();
            }
        });
    }).then( function() {
        if (options['subject'] == "oauth2-client" && options['authorizeUrl']) {
    		console.log('Auto-creating your ['+options['subject']+' OAuth2 Client extension.zip ...');
    		doCreateExtension(options);
    		console.log('\n\nNext Steps:\n**************************************************************************');
    		console.log('If you are ready-to-go, simply upload the [extension.zip] add-on to your Jive instance to obtain your clientId/clientSecret for your OAuth2 client.');
    		console.log('\nIf you would like to make changes, EDIT the [jiveclientconfiguration.json] and/or UPDATE icons in [/extension_src], SAVE and then RUN [jive-sdk build] to re-generate [extension.zip].');
    		console.log('**************************************************************************\n\n');
        } else {
            console.log('\nThings to do now:');
            console.log();
            console.log('(1)  Install dependent modules:');
            console.log('         npm update ');
            console.log('(2)  If applicable, edit jiveclientconfiguration.json to specify your clientID, clientSecret, clientUrl, and other setup options.');
            console.log('(3a) If you are running a Jive Node SDK service, use this command to build an add-on package and start the service:');
            console.log('         node app.js');
            console.log('(3b) If you just want to use the SDK to build an add-on package (without a service), use one of these commands:')
            console.log('         jive-sdk build add-on');
            console.log('         jive-sdk build add-on --apphosting="jive"');
            console.log();
        } // end if
    });
}

function doStyle( options ) {
    var force = options['force'];
    var target = options['target'] || process.cwd();

    var style =  options['subject'];
    var name = options['name'] || 'sample' + style;
    var type = style == 'activity' ? 'activity' : style;
    var authorizeUrl = options['authorizeUrl'] ? options['authorizeUrl'] : null;

    processDefinition(target, type, name, style, force, authorizeUrl).then( function() {
        finish(target,options);
    });
}

function doExample( options ) {
    var force = options['force'];
    var target = options['target'] || process.cwd();

    var example =  options['subject'];
    var name = options['name'] ? options['name'] : example;
    var authorizeUrl = options['authorizeUrl'] ? options['authorizeUrl'] : null;

    processExample(target, example, name, force,authorizeUrl).then( function() {
        finish(target,options);
    });
}

function doAll( options ) {
    var force = options['force'];
    var target = options['target'] || process.cwd();
    var authorizeUrl = options['authorizeUrl'] ? options['authorizeUrl'] : null;

    var promises = [];
    styles.forEach( function(style) {
        var name = 'sample' + style + (options['name'] ? '-' + options['name'] : '' );
        var type = style == 'activity' ? 'activity' : style;
        promises.push( processDefinition(target, type, name, style, force, authorizeUrl));
    });

    examples.forEach( function( example ) {
        var name = example + ( options['name'] ? ('-' + options['name'] ) : '');
        promises.push(processExample(target, example, name, force,authorizeUrl));
    });

    q.all(promises).then( function() {
        var root = __dirname;
        return jive.util.fsTemplateCopy( root + '/base/package.json', target + '/package.json', { 'TILE_NAME': 'jive-examples-all' } )
            .then( function() { return finish(target,options); });
    });
}

function sortItems(itemArray) {
    var basicItems = [];
    var exampleItems = [];

    itemArray.sort().forEach( function(item) {

        // put examples in a separate array
        if (item.indexOf('example-') == 0) {
            exampleItems.push(item);
        } else {
            basicItems.push(item);
        }
    });

    return { basicItems: basicItems, exampleItems: exampleItems}
}



function displayDetailedItems(itemArray, columnSize) {

    for (var itemIndex in itemArray) {
        process.stdout.write('   ' + itemArray[itemIndex]);

        // Add more spaces so that columns line up (except when item name too long)
        for (var spaceIndex = 0; spaceIndex < (columnSize + 2 - itemArray[itemIndex].length); spaceIndex++) {
            process.stdout.write(' ');
        }

        if (itemDescriptions[itemArray[itemIndex]] != null) {
            console.log(itemDescriptions[itemArray[itemIndex]]);
        } else {
            console.log();
        }
    }
}

function doHelp() {
    console.log('usage: jive-sdk <command> <item> [--options]\n');
    console.log('Available commands:');
    console.log('   help                      Display this help page');
    console.log('   list   (category)         List the existing items for a category');
    console.log('   create <template>         Create a jive-sdk template or example');
    console.log('   build                     Build an addon package');
    console.log('   unpack <addOnZipFile>     Create project from Simple Stream Integration addon (see: https://developer.jivesoftware.com/quickstart)\n');

    // Display list items
    console.log('Available category items for list command:');
    _.each(groups, function(group) {
        console.log('   ' + group);
    });

    // Display create items
    var itemResults = sortItems(examples.concat(styles));
    console.log();
    console.log('Available template items for create command:');
    displayDetailedItems(itemResults.basicItems, 20);
    console.log('   (Use "jive-sdk list examples" to view other items that you can create)');
    console.log();

    console.log('Available items for build command:');
    console.log('   ' + 'add-on');

    // Display options
    console.log();
    console.log('Available options:');
    console.log('   --force=<true/false>         Whether to overwrite existing data;');
    console.log('                                defaults to false');
    console.log('   --name="<string>"            Use the specified string for the new item name');
    console.log('   --apphosting="<self|jive>"   Where app will be hosted when building add-on;')
    console.log('                                "jive" apps are packaged in the add-on,');
    console.log('                                "self" apps are hosted externally;');
    console.log('                                defaults to "self"');
    console.log('   --oauthAuthorizeUrl="...."   Used only with "jive-sdk create oauth2-client" for;');
    console.log('                                simple OAuth2 client generation');
    console.log();
}

function execute(options) {
    var cmd = options['cmd'];
    options.target = options.target || process.cwd();

    if ( cmd === 'help' ) {
        doHelp();
    }

    if ( cmd == 'create') {
        var subject = options['subject'];

        if ( subject == 'all' ) {
            doAll( options );
            return;
        }

        // Deprecated items are automatically changed to the new names
        if (_.contains(deprecatedNames,subject)) {
            var refactoredName = refactoredNames[deprecatedNames.indexOf(subject)];
            console.log("WARNING: Item name "+subject+" has changed. Using "+refactoredName+" instead.");
            options['subject'] = subject = refactoredName;
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

    if ( cmd === 'list' ) {
        if( !options.subject ) {
            options.subject = 'all';
        }
        var printGroup = function( group ) {
            console.log(group + ":");
            _.each(groupedExamples[group], function( example ) {
                console.log("    " + example);
            });
        };

        if( options.subject === 'all' ) {
            _.each(groupedExamples, function( exampleArray, group ) {
                printGroup(group);
                console.log("");
            });

        } else {
            printGroup(options.subject);
        }
    }

    if ( cmd === 'createExtension' || cmd === 'build' ) {
        doCreateExtension( options );
    }

    if (cmd === 'unpack') {
    	doUnpackAddOn(options['subject'],options);
    }
}

function doCreateExtension( options ) {
    jive.service.init({use: function() {}, all: function() {}})
        .then(function() {
            return jive.service.autowire();
        } )
        .then(function() {
            var extension = require("../lib/extension/extension.js");

            extension.prepare(
                    '',
                    options.target + "/tiles",
                    options.target + "/apps",
                    options.target + "/cartridges",
                    options.target + "/storages",
                    options.target + "/services",
                    options.apphosting === 'jive'
                ).then(function(){
                var persistence = jive.service.persistence();

                persistence.close().then(function() {
                    process.nextTick(function() {
                        process.exit(0);
                    });
                })
            });
        });
}

function doUnpackAddOn( zipFile, options ) {
	var path = require('path');
	var force = options['force'];
	var name = options['name'] || path.basename(zipFile,'.zip');
	var target = options['target'] || process.cwd();

    /*** UNZIP EXTENSION TO extension_src ***/
    jive.util.unzipFile(zipFile, target+'/extension_src')
    .then(
        /*** BRING IN THE BASE ADDON FILES ***/
        jive.util.recursiveCopy(__dirname + '/base', target, force, { 'TILE_NAME': name, 'TILE_STYLE': '', 'host': '' })
    )
    .then( function() {

                //TODO:  ADD LOTS OF ERROR HANDLING AND USE-CASES CATCHES - CURRENTLY OPTIMIZED FOR JUST SIMPLE STREAM INTEGRATION STORY

                /*** SYNC METADATA FROM ADDON TO PROJECT FILES ***/
                var metaJsonFilePath = target+'/extension_src/meta.json';
                var jiveClientConfigurationJsonFilePath = target+'/jiveclientconfiguration.json';

                //console.log('meta.json',metaJsonFilePath);
                //console.log('jiveclientconfiguration.json',jiveClientConfigurationJsonFilePath);

                /*** READ EXTRACTED ADDON meta.json & GENERATED jiveclientconfiguration.json FOR COPY OF VALUES ***/
                readJsonFile( metaJsonFilePath ).then(
                    function (metaJson) {
                        readJsonFile( jiveClientConfigurationJsonFilePath ).then(
                            function (clientConfiguration) {
//			        				console.log('meta.json',metaJson);
//			        				console.log('jiveclientconfiguration.json',clientConfiguration);

                                /**** UPDATE jiveclientconfiguration.json WITH VALUES FROM THE meta.json ****/
                                if (metaJson["service_url"]) {
                                    clientConfiguration["clientUrl"] = metaJson["service_url"];
                                    if (metaJson["service_url"] === "http://localhost" || metaJson["service_url"] === "http:") {
                                        clientConfiguration["suppressAddonRegistration"] = true;
                                    } // end if
                                } // end if

                                clientConfiguration["extensionInfo"] = {};

                                /** NON-SYMETRICAL VALUES **/
                                clientConfiguration["extensionInfo"]["uuid"] = metaJson["id"];
                                clientConfiguration["extensionInfo"]["packageVersion"] = metaJson["package_version"];
                                clientConfiguration["extensionInfo"]["releasedOn"] = metaJson["released_on"];

                                if (metaJson["author"]) {
                                    clientConfiguration["extensionInfo"]["author"] = metaJson["author"];
                                    clientConfiguration["extensionInfo"]["author_affiliation"] = metaJson["author_affiliation"];
                                    clientConfiguration["extensionInfo"]["author_email"] = metaJson["author_email"];
                                } // end if

                                ["id","name","type","description","minimum_version","minimum_edition","status","icon_16","icon_48","icon_128",
                                 "register_url","unregister_url","redirect_url","config_url","health_url","website_url","community_url",
                                 "support_info","info_email","tags","overview","install_instructions","eula_filename","privacy_policy",
                                 "screen_shots", "solution_categories","target_integrations","key_features","target_integrations"
                                ].forEach(
                                   function(key) {
                                    clientConfiguration["extensionInfo"][key] = metaJson[key];
                                   } // end function
                                 );

                                clientConfiguration["logLevel"] = "DEBUG";
                                clientConfiguration["ignoreExtensionRegistrationSource"] = "false";

                                /*** WRITE UPDATES BACK TO jiveclientconfiguration.json ***/
                                fs.writeFileSync(jiveClientConfigurationJsonFilePath, JSON.stringify(clientConfiguration, null, '\t'));
                                conditionalMkdir(target+"/test",true);
                                unpackDefinitions(target);

			    				} // end function
    			    		);
    			    	} // end function
    			    );

    			} // end function
    		);
    	} // end function


function unpackDefinitions(target) {

    var definitionJsonFilePath = target+'/extension_src/definition.json';
    //console.log('definition.json',definitionJsonFilePath);

    readJsonFile( definitionJsonFilePath ).then(
		function (definitionJson) {
			var tiles = definitionJson["tiles"];
			if (tiles) {
				var tilesDir = target + '/tiles';
				/*** CREATE PARENT /tiles DIRECTORY ***/
				conditionalMkdir(tilesDir,true).then(
					function() {
						for (var x in tiles) {
							var tile = tiles[x];
							//console.log("tile",tile);
							/*** CREATE CHILD /tiles/xxxxx DIRECTORY ***/
							var tileDir = tilesDir + "/" + tile["name"];
							conditionalMkdir(tileDir,true).then(
								function() {
									/*** COPY TILE definition.json FROM EXISTING ADD-ON ***/
									fs.writeFileSync(tileDir + "/definition.json", JSON.stringify(tile, null, '\t'));
								} // end function
							);
							conditionalMkdir(tileDir + "/backend",true).then(
								function() {
									conditionalMkdir(tileDir + "/public",true).then(
										function() {
											/*** NOOP ***/
										} // end function
									);
								} // end function
							);
						} // endfor
					} // end function
				);
			} // end if
		} // end function
    );

} // end function

function prepare() {
    var root = __dirname;

    return jive.util.fsreaddir( root + '/styles').then(function(items) {
        styles = styles.concat( items );
        _.each(styles, function( item ) {
            groupedExamples['tiles'].push(item);
        });
    }).then( function() {
        return jive.util.fsreaddir( root + '/examples').then(function(items) {
            var deferreds = [];
            examples = examples.concat( items );
            _.each(examples, function( item ) {
                _.each(groups, function( group ) {
                    var deferred = q.defer();
                    deferreds.push(deferred);
                    jive.util.fsexists( root + '/examples/' + item + "/" + group).then(function(exists) {
                        if(exists) {
                            groupedExamples[group].push(item);
                        }
                        deferred.resolve();
                    });
                });
            });

            var itemResults = sortItems(examples.concat(styles));
            groupedExamples['examples'] = itemResults.exampleItems;

            return q.allSettled(deferreds);
        } );
    });
}

var readJsonFile = function( file ) {
    return jive.util.fsexists( file ).then( function(exists) {
        if ( exists ) {
            return jive.util.fsreadJson( file ).then( function(json) {
                if ( json ) {
                    return json;
                } else {
                    return null;
                }
            });
        } else {
            return null;
        }
    });
};

var getSDKVersion = function() {
    var sdkPackagePath = __dirname + '/../../package.json';
    return jive.util.fsexists( sdkPackagePath ).then( function(exists) {
        if ( exists ) {
            return jive.util.fsreadJson( sdkPackagePath ).then( function(packageContents) {
                if ( packageContents ) {
                    return packageContents['version'];
                } else {
                    return null;
                }
            });
        } else {
            return null;
        }
    });
};

exports.init = function(target) {
    getSDKVersion().then( function(version ) {
        if ( version ) {
            console.log("Jive Node SDK version " + version);
        }
    }).then( function() {
        // init lists
        prepare().then( function() {

            // default command to help
            var cmd = argv._.length > 0 ? argv._[0] : 'help';
            var subject = argv._[1];

            var name = argv['name'];
            var apphosting = argv['apphosting'];
            var force = argv['force'] || false;
            var authorizeUrl = argv['oauthAuthorizeUrl'];

            if (name) {
                name = name.replace(/[^\S]+/, '');
                name = name.replace(/[^a-zA-Z0-9]/, '-');
            }

            var options = {
                'name'      : name,
                'apphosting': apphosting,
                'cmd'       : cmd,
                'subject'   : subject,
                'force'     : force,
                'target'    : target,
                'authorizeUrl'	: authorizeUrl
            };

            var err = validate(options);
            if ( err.length > 0 ) {
                console.log('Could not execute command, errors were found:');
                err.forEach( function(err) {
                    console.log(err);
                });

                console.log();

                doHelp();

                process.exit(-1);
            }

            execute(options);
        });

    });

};
