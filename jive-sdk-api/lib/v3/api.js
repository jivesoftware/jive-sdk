//sets up jQuery to use XMLHttpRequest for transport and creates the global jQuery object
require("./jquery-transport"); 
var core = require("./core");
var jive = require('../../api');
var $ = jQuery;

function queryToDeferred(response, deferred) {
    if (response.error) {
	jive.logger.info("CoreV3 Request failed" );
	jive.logger.debug("CoreV3 Request failed", response, this);
	deferred.reject(response, this);
    }
    else {
	if(response.list){
	    deferred.resolve(response.list, response);
	}else{
	    deferred.resolve(response);
	}
    }
}

function runQuery(query, deferred) {
    if(!deferred){
	deferred = new $.Deferred();
    }
    query.execute(function(response){
	queryToDeferred(response, deferred);
    }, this.getRequestContext());
    return deferred.promise();
}

function Base(){}
Base.prototype = core.osapi.jive.corev3;

function CoreApi(jiveUrl, beforeSend){
	this.jiveUrl = jiveUrl;
	this.beforeSend = beforeSend;
}
CoreApi.prototype = new Base();
CoreApi.prototype.getRequestContext = function(){
	return {
		jiveUrl: this.jiveUrl,
		beforeSend: this.beforeSend
	}
};
CoreApi.prototype.runQuery = runQuery;
CoreApi.prototype.runAll = function runAll(requests){
    var key = 0;
    var batch = core.osapi.newBatch();
    var deferreds = [];
    $.each(requests, function(){
	batch.add(String(key++), this);
	deferreds.push(new $.Deferred());
    });

    batch.execute(function(responseMap){
	var thisArg = {
	    batch: batch,
	    rawResponse: responseMap
	};
	for(var i = 0; i < key; ++i){
	    var keyStr = String(i);
	    thisArg.key = keyStr;
	    queryToDeferred.call(thisArg, responseMap[keyStr], deferreds[i]);
	}
    }, this.getRequestContext());
    if(deferreds.length > 1){
	return $.when.apply($, deferreds);
    }else if(deferreds.length == 1){
	//$.when special-cases a single deferred argument, in that it doesn't wrap a multi-arg result in a
	//singleton array.  We un-special-case that here so that we can make format assumptions in handlers.
	return deferreds[0].pipe(arrayWrap, arrayWrap, arrayWrap);
    }else{
	return $.when(); //succeeds immediately with no args to done.
    }

    function arrayWrap(){
	if(arguments.length > 1){
	    return Array.prototype.slice.apply(arguments);
	}else if(arguments.length == 1){
	    return arguments[0];
	}else{
	    //return a successful zero-arg promise
	    return $.when();
	}
    }
}

module.exports = exports = CoreApi;
