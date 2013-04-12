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

var jive = require('../api');

/**
 * Loads the application specified by jiveclientconfiguration.json into memory,
 * or attempts to register a new application based on jiveclientconfiguration.json if the
 * app doesn't exist.
 * @param app
 */
exports.configureApplication = function( app ) {
    var jiveApi = app.settings['jiveApi'];
    var jiveClient = app.settings['jiveClient'];
    var config = jive.config.fetch();
    var appName = config.appName;

    if ( config.clientId && config.clientSecret ) {
        // client id and secret are specified in configuration file

        jive.Application.findByID(config.clientId).execute( function(foundApp ) {
            if ( foundApp ) {
                // exists
                console.log("Finished client config");
                app.emit('event:clientAppConfigurationComplete', app);
            }  else {
                // check if still valid
                jiveClient.Application.retrieve( config.clientId,
                    function(application) {
                        // persist
                        jive.Application.save( application ).execute(function(){
                            config.clientId = application.clientId;
                            config.clientSecret = application.clientSecret;

                            console.log("Finished client config");
                            app.emit('event:clientAppConfigurationComplete', app);
                        });
                    },
                    function() {
                        // invalid client ID
                        console.log("Failed client config");
                        app.emit('event:clientAppConfigurationFailed', "Invalid client ID");
                    }
                );
            }
        });

    } else {

        jive.Application.findByAppName(appName).execute( function(foundApp) {
            if ( foundApp ) {
                config.clientId = foundApp.clientId;
                console.log("Finished client config");
                app.emit('event:clientAppConfigurationComplete', app );
            } else {
                // register app, and proceed
                jiveClient.Application.register(
                    {
                        'appName' : config.appName,
                        'appDescription': config.appDescription,
                        'userEmail': config.userEmail,
                        'userPassword': config.userPassword,
                        'callbackURL': config.callbackURL
                    },
                    function( application ) {
                        // set clientId
                        config.clientId = application.clientId;
                        application.name = config.appName;
                        jive.Application.save( application ).execute(function(){
                            console.log("Finished client config");
                            app.emit('event:clientAppConfigurationComplete', app);
                        });
                    },
                    function(){
                        console.log("Failed client config");
                        app.emit('event:clientAppConfigurationFailed', "Unable to register application");
                    }
                );
            }
        });

    }

};

