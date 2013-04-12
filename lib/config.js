var bootstrap = require('../app/bootstrap');

var config = {
};

exports.fetch = function() {
    return config;
};

exports.save = function( _config ) {
    config = _config;
};

exports.bootstrap = bootstrap.start;
