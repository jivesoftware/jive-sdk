var streamify = require('stream-array');

exports.createCursor = function(items) {
    var stream = streamify(items);

    var nextCtr = 0;

    stream.next = function(processorFunction) {
        if ( !processorFunction ) {
            return null;
        }
        nextCtr++;
        if ( nextCtr > items.length - 1 ) {
            processorFunction(null, null);
        } else {
            processorFunction(null, items[nextCtr]);
        }
    };

    stream.limit = function(number, callback) {
        items.splice((items.length - number) * -1, items.length - number);
        if (callback) {
            callback(null, items);
        }

        return stream;
    };

    stream.sort = function(doc, callback) {
        items.sort(function(a, b) {
            var result = 0;

            for (var key in doc) {
                if (doc.hasOwnProperty(key)) {
                    if (result === 0) {
                        var first = doc[key] === - 1 ? b[key] : a[key];
                        var second = doc[key] === - 1 ? a[key] : b[key];

                        if (first === second) {
                            result = 0;
                        } else if (first > second) {
                            result = 1;
                        } else {
                            result = -1;
                        }
                    } else {
                        break;
                    }
                }
            }

            return result;
        });

        if (callback) {
            callback(null, items);
        }

        return stream;
    };

    return stream;
};

exports.findMatchingKeys = function (collection, keyValues) {
    var result = [];
    var findKeys = keyValues ? Object.keys( keyValues ) : undefined;

    for (var colKey in collection) {
        if (collection.hasOwnProperty(colKey)) {

            var entryToInspect = collection[colKey];
            var match = true;
            if ( findKeys ) {
                for ( var i in findKeys ) {
                    var findKey = findKeys[i];
                    var keyParts = findKey.split('.');
                    var entryObj = entryToInspect;
                    for ( var k = 0; k < keyParts.length; k++ ) {
                        var keyPart = keyParts[k];
                        if ( typeof entryObj == 'object' ) {
                            entryObj = entryObj[keyPart];
                        }
                    }

                    var keyValue = keyValues[ findKey ];
                    if ( typeof keyValue == 'object' ) {

                        if ( keyValue['$gt'] ) {
                            if ( entryObj <= keyValue['$gt'] ) {
                                match = false;
                                break;
                            }
                        }

                        if ( keyValue['$gte'] ) {
                            if ( entryObj < keyValue['$gte'] ) {
                                match = false;
                                break;
                            }
                        }

                        if ( keyValue['$lt'] ) {
                            if ( entryObj >= keyValue['$lt'] ) {
                                match = false;
                                break;
                            }
                        }

                        if ( keyValue['$lte'] ) {
                            if ( entryObj > keyValue['$lte'] ) {
                                match = false;
                                break;
                            }
                        }

                        if ( keyValue['$in'] ) {
                            if ( keyValue['$in'].indexOf(entryObj) < 0 ) {
                                match = false;
                                break;
                            }
                        }

                    } else {
                        if ( entryObj !== keyValue ) {
                            match = false;
                            break;
                        }
                    }
                }
            }

            if ( match ) {
                result.push( colKey );
            }
        }
    }

    return result;
};