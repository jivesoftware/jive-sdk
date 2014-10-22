var jive = require("jive-sdk"),
    request = require("request"),
    q = require("q");

// TODO: replace with jive.service.serviceURL()

exports.getPerformance = function() {
  var deferred = q.defer(),
      url = jive.service.serviceURL() + "/performanceservice/last";
  request.get({uri: url, timeout: 2500}, function(err, response, body) {
    if (err) {
      deferred.reject();
    } else {
      deferred.resolve(body);
    }
  });
  return deferred.promise;
}

/**
 * [ 1, 2000, 1500, 500 ] and a 'body' responseTime
 * example: responseTime '750' would return index 2
 */
exports.getRangeIndex = function(ranges, body) {
  var responseTime = parseInt(body);
  if (isNaN(responseTime) || responseTime < 1) {
    return 0;
  }
  var result = 0, lastLimit = Number.MAX_VALUE;
  ranges.forEach(function(limit, index) {
    if (isNaN(limit)) {
      limit = 1
    }
    if (responseTime < limit && limit < lastLimit) {
      result = index;
      lastLimit = limit;
    }
  });
  return result;
}
