exports.testSave = function(testUtils, persistence, collection, key, obj ) {
    return persistence.save( collection || testUtils.guid(), key || testUtils.guid(), obj
        || { 'data' : testUtils.guid() });
};