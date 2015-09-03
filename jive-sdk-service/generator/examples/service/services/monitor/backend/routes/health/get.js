var jive = require('jive-sdk');

exports.route = function(req, res) {
    var conf = jive.service.options;
    var myConf = jive.service.options['ext'];

    // status values: ok, fault, unknown, intermittent, maintenance
    
    return res.status(200).send(
    	{
    	  'status': 'ok',
    	  'lastUpdate' : new Date().toISOString(),
    	  'messages' : [
    	      {
    	    	  'detail' : 'example detail',
    	    	  'fix' : 'example fix',
    	    	  'level' : 'info',
    	    	  'summary' : 'sample summary'
    	      }
    	  ],
    	  'resources' : [
       	      {
       	    	  'lastUpdate' : new Date().toISOString(),
    	    	  'name' : 'example name',
    	    	  'status' : 'ok',
    	    	  'url' : 'http://www.jivesoftware.com'
    	      }
    	 ]
    	}
    );
};
