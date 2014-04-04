var jigPersistence = function( userId ) {

    userId = userId || '@me';

    var fetch = function( fields, success, error ) {
        if ( fields.length < 1 ) {
            var options = {
                userId: userId,
                escapeType: opensocial.EscapeType.NONE
            };
        } else {
            var options = {
                fields : fields,
                userId: userId,
                escapeType: opensocial.EscapeType.NONE
            };
        }

        osapi.appdata.get( options ).execute(function(response) {
            if (response.error) {
                console.log( "fetch error", response.error );
                if ( error ) error();
            }
            else {
                if ( success ) success(response);
            }
        });
    };

    var remove = function( fields, success, error ) {
        var options = {
            keys : fields,
            userId: '@me'
        };
        console.log( "to remove", options );
        osapi.appdata['delete']( options ).execute(function(response) {
            if (response.error) {
                console.log( "delete error", response.error );
                if ( error ) error();
            }
            else {
                if ( success ) success(response);
            }
        });
    };

    var update = function( key, value, success, error ) {
        var obj = {};
        obj[key] = value;
        osapi.appdata.update({
            data : obj,
            userId: '@me',
            escapeType: opensocial.EscapeType.NONE
        }).execute(function(response) {
                if (response.error) {
                    console.log( "update error", response.error );
                    if ( error ) error();
                } else {
                    console.log( "update response", response );
                    if ( success ) success();
                }
            });
    };

    this.save = function ( json, success, key ) {
        update( key || "jig", json, success );
    };

    this.load = function( success, key) {
        fetch( [key], function( response ) {

            // get data for the first user (should be only one anyway)
            var theData;
            for( var user in response ) {
                if(response.hasOwnProperty(user)) {
                    theData = response[user];
                    break;
                }
            }

            for( var id in theData ) {
                console.log( theData );
                if (theData.hasOwnProperty(id) ) {
                    var raw = theData[key || "jig"];
                    if ( raw ) {
                        var json = JSON.parse( raw );
                        success( json );
                        return;
                    }
                }
            }

            success(null);

        });
    };

};
