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
 * Loads the application specified by jiveclientconfiguration.json into memory,
 * or attempts to register a new application based on jiveclientconfiguration.json if the
 * app doesn't exist.
 * @param app
 * @return {*|Boolean}
 */
exports.configureApplication = function( app ) {
    var jiveApi = app.settings['jiveApi'];
    var config = app.settings['jiveClientConfiguration'];
    var appName = config.appName;

    jiveApi.Application.findByAppName(appName).execute( function(foundApp) {
        if ( foundApp ) {
            config.clientId = foundApp.clientId;
            console.log("Finished client config");
            app.emit('event:clientAppConfigurationComplete', app);
        } else {
            // register app, and proceed
            app.settings['jiveClient'].Application.register(
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
                    jiveApi.Application.save( application ).execute(function(){
                        console.log("Finished client config");
                        app.emit('event:clientAppConfigurationComplete', app);
                    });
                },
                function(){
                    console.log("Finished client config");
                    app.emit('event:clientAppConfigurationFailed', app);
                }
            );
        }
    });
};

