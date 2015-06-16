var jive = require("jive-sdk");

exports.route = function(req, res){
  res.render('action.html', { host: jive.service.serviceURL() });
};