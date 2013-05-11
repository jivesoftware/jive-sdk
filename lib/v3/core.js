(function() { // scoping function

/*
 * Including JS template resource from run-first.js
 *     jiveID : "\"6d2ddf3b-9ade-4b2d-9c3e-f4ae50f2898b\""
 */

/**
 * Detect if we have already been included, and abort if so.
 */
if(typeof window != "undefined"){
    window.jive_js = window.jive_js || {};

    if (window.jive_js["6d2ddf3b-9ade-4b2d-9c3e-f4ae50f2898b"] === true) {
        return; // abort the scoping function, we've already been run
    }

    window.jive_js["6d2ddf3b-9ade-4b2d-9c3e-f4ae50f2898b"] = true; // mark as run.
}

/***[ Internal Utilities ]***\
*                             *************************************************\
* Some JavaScript utilities to reduce external dependencies.                   *
\******************************************************************************/

/*
 * Including JS template resource from base-util.js
 *     jiveVersion : "\"7.0.0.0 7c3\""
 *     version : "{\n        \"revision\": 3,\n        \"version\": 3\n    }"
 */

/**
 * The window object, shorter and always available by scope.
 * @type {window}
 */
var $w = (function(){
    if(typeof window != "undefined"){
        return window;
    }else if(typeof exports != "undefined"){
        return exports;
    }
    return {};
})();

/**
 * A convenient way to reference the undefined value.
 * @type {Undefined}
 */
var $u = void(0); // undefined

/**
 * Resolves global objects by name, creating intermediate objects as necessary.
 * If a factory function is specified and that function returns undefined, the
 * leaf node is not added and undefined is returned.
 * @param n {String} The path of the global object, using "." to separated members
 * @param f {Function} an optional factory function to create the leaf element if necessary
 * @return {Object} the object as found or created
 */
function $r(n, f) { // resolve name
    var o = $w;
    var z = n.split(".");
    for (var i = 0, l = z.length, p = z[i]; i < l; p = z[++i]) {
        if (o.hasOwnProperty ? o.hasOwnProperty(p) : typeof o[p] !== "undefined") {
            o = o[p];
        }
        else if (f && i == (l - 1)) {
            var v = f();
            if (typeof v !== "undefined") {
                o[p] = v;
            }
            o = o[p];
        }
        else {
            o = o[p] = {};
        }
    }
    return o;
}

/**
 * A shim for older browsers that do not support the ECMAScript 5 toISOString()
 * function on Date
 */
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function () {
        function pad(n) {
            return n < 10 ? '0' + n : n
        }
        return this.getUTCFullYear() + '-'
            + pad(this.getUTCMonth() + 1) + '-'
            + pad(this.getUTCDate()) + 'T'
            + pad(this.getUTCHours()) + ':'
            + pad(this.getUTCMinutes()) + ':'
            + pad(this.getUTCSeconds()) + 'Z';
    };
}

/**
 * Adds a function to be called by the Core v3 JS mechanism after all inline
 * code has been executed. This function may be called during the execution of
 * a load handler. Later invocation will execute the function immediately.
 * @param handlerFunction A function to be invoked after inline code has
 *     executed.
 */
var registerOnLoadHandler = (function() {
    var loadHandlers = [];
    var closed = false;
    return function(handlerFunction) {
        if (closed) {
            if (typeof handlerFunction === "function") {
                handlerFunction();
            }
        }
        if (handlerFunction === registerOnLoadHandler) {
            while (loadHandlers.length) {
                var f = loadHandlers.shift();
                if (typeof f === "function") {
                    f();
                }
            }
            closed = true;
        } else {
            loadHandlers.push(handlerFunction);
        }
    };
})();

/**
 * Extends an object by adding properties from subsequent passed elements.
 * Properties of passed objects take precedence in the order passed. If three
 * objects are passed, and all contain the property "foo", the value of the
 * third object will be used.
 * @param o {Object} The object to extend
 * @param e1 {Object} an object to copy properties from
 * @param e2 {Object} another object to copy properties from
 * @return {Object} The first object passed, with new properties set
 */
function $e(o, e1, e2) { // extend object
    var a = arguments;
    for (var i = 1; i < a.length; i++) {
        var e = a[i];
        if (typeof e === "object") {
            for (var k in e) {
                if (e.hasOwnProperty(k)) {
                    o[k] = e[k];
                }
            }
        }
    }
    return o;
}

/**
 * Tests the passed object to see if it has any defined properties. If the empty
 * object {} is passed, or if the passed value is not an object, false is
 * returned.
 * @param o {Object} the object to test
 * @return {Boolean} true if the passed object contains at least one property.
 */
function isObjectWithProperties(o) {
    if (typeof o !== "object") {
        return false;
    }
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            return true;
        }
    }
    return false;
}

/**
 * Removes properties from obj that are defined in filter, and returns a new
 * object containing only those properties.
 * @param obj {Object} The source object, form which properties may be removed.
 * @param filter {Object} An object, used to identify which properties of obj
 *     should be moved to the returned object. This object is typically build
 *     using quickLookupFromArray().
 * @return {Object} A new object containing only the properties removed form
 *     the source object.
 */

function partitionObject(obj, filter) {
    var o = {};
    for (var k in obj) {
        if (obj.hasOwnProperty(k) && obj[k] != null) {
            if (filter[k] === true) {
                o[k] = obj[k];
                delete obj[k];
            }
        }
    }
    return o;
}

/**
 * Converts an array of strings into a map of string to boolean. This can make
 * repeated testing of values in the array faster.
 * @param array {Array} An array of strings to convert into a map.
 * @return {Object} A map where the keys are the values in the passed array,
 *     and the values are boolean true.
 */
function quickLookupFromArray(array) {
    var o = {};
    for (var i = 0; i < array.length; i++) {
        o[array[i]] = true;
    }
    return o;
}

/**
 * wrapper for Array.prototype.indexOf functionality for cross browser compatibility
 * @param array - array of items to be searched for
 * @param item - the item to be search for
 */
function arrayIndexOf(array, item) {
    if (array == null) return -1;
    var i, l;
    var nativeIndexOf = Array.prototype.indexOf;
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
}

/**
 * An object that holds core-api extensions and customizations. Default values
 * defined in the core api are on the function prototype, overridden values are
 * on the object itself.
 */
var Ext = function(){}; // the constructor
var ext = new Ext(); // the instance

// now, absorb existing extensions that are defined...
$e(ext, $r("osapi.jive.corev3.extensions"));
// ...and replace the global extensions object with the real one.
osapi = $w.osapi;
osapi.jive.corev3.extensions = ext;

/**
 * Default extensions are implemented here.
 */
$e(Ext.prototype, {
    /**
     * A function to run another function when the mechanism is ready. This
     * call may run the passed function in the current execution context, or
     * run it later. It is expected that if "we are not yet ready" that passed
     * functions are queued and run in the order requested once "we are ready".
     * @param fn The function to execute.
     * @default Runs the passed function immediately.
     */
    runWhenReady: function(fn) {
        return fn();
    }
});

/**
 * Utility function that processes parameter overrides for instance methods and
 * resolves values relative to a local instance then applies them to a target
 * object.
 * @param local The local object used to resolve value references.
 * @param target The target object to have overridden values applied to.
 * @param overrides The map of overridden keys and values.
 */
function applyOverrides(local, target, overrides) {
    overrides = overrides || {};
    target = target || {};
    var sets = [];
    var dels = [];
    for (var key in overrides) {
        if (overrides.hasOwnProperty(key)) {
            var value = overrides[key];
            var l = value;
            var deleteKey = false;
            if (/^@(this|self)\b/.test(value)) {
                l = value.charAt(1) == "t" ? local : target;
                value = value.split(".");
                for (var v = 1; l != null && v < value.length; v++) {
                    l = l[value[v]];
                }
            }
            else if (/^@(true|false)$/.test(value)) {
                l = value.charAt(1) == 't';
            }
            else if ("@delete" == value) {
                deleteKey = true;
            }
            if (l == null) continue;
            key = key.split(".");
            var t = target;
            for (var k = 0; k < key.length; k++) {
                if (k + 1 == key.length) {
                    op(t, key[k], l, deleteKey);
                }
                else {
                    t = t[key[k]] || {};
                }
            }
        }
    }
    function op(obj,key,val,del) {
        if (del) {
            dels.push(function() {
                delete obj[key];
            });
        } else {
            sets.push(function() {
                obj[key] = val;
            });
        }
    }
    var ops = sets.concat(dels);
    for (var i = 0, j = ops.length; i < j; i++) {
        ops[i]();
    }
    return target;
}

/**
 * Expose the core api version information.
 */
$r("osapi.jive.corev3.version", function() {
    var ver = {
        "revision": 3,
        "version": 3
    };
    var versionString = ver.version + "." + ver.revision;
    versionString.major = ver.version;
    versionString.minor = ver.revision;
    return versionString;
});

$r("osapi.jive.corev3.parseDate", function() {
    var testDateStr = "2012-07-19T06:59:59.000+0000";
    var d = new Date(testDateStr);
    if (isValidDate(d)) {
        return parseDateDefaultOrNull;
    }
    else {
        return jiveParseDate;
    }
});

$r("osapi.jive.corev3.formatDate", function() {
    return formatJiveDate;
});

//****************Parsing the dates returned from Jive***********************

var dateRegex=/(\d\d\d\d)-(\d?\d)-(\d?\d)T(\d?\d):(\d\d):(\d\d)\.(\d\d\d)\+0000/;

function jiveParseDate(dateString) {

    //First try to match the strict date format from Jive
    var match = dateRegex.exec(dateString);
    if (!match) {
        //If they are using this on some date other than the strict jive format, fallback on default date formatting
        return parseDateDefaultOrNull(dateString);
    }
    var year = parseInt(match[1]);
    var month = parseInt(match[2]) - 1; //javascript expects a month between 0 and 11
    var day = parseInt(match[3]);
    var hour = parseInt(match[4]);
    var min = parseInt(match[5]);
    var s = parseInt(match[6]);
    var ms = parseInt(match[7]);

    var d2 = new Date();
    d2.setUTCFullYear(year, month, day);
    d2.setUTCHours(hour, min, s, ms);

    return d2;
}

function parseDateDefaultOrNull(dateString) {
    var d = new Date(dateString);
    if (isValidDate(d)) {
        return d;
    }
    return null;
}


function isValidDate(dateObj) {
    if (!dateObj) {
        return false;
    }
    if (!(dateObj instanceof Date)){
        return false;
    }
    if (isNaN(dateObj.getTime())){
        return false;
    }
    return true;
}

//*************Formatting dates to be sent to Jive*********************

function formatJiveDate(date) {

    if (Date.prototype.toISOString) {
        return date.toISOString().replace(/Z$/, "+0000");
    }

    function pad(number) {
        var r = String(number);
        if ( r.length === 1 ) {
            r = '0' + r;
        }
        return r;
    }

    return date.getUTCFullYear()
        + '-' + pad( date.getUTCMonth() + 1 )
        + '-' + pad( date.getUTCDate() )
        + 'T' + pad( date.getUTCHours() )
        + ':' + pad( date.getUTCMinutes() )
        + ':' + pad( date.getUTCSeconds() )
        + '.' + String( (date.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
        + '+0000';
}
/*
 * Including JS template resource from base-urls.js
 *     jiveURL : "\"http://whelan-z800.jiveland.com:8080\""
 */

/**
 * The base jiveURL, injected by the template mechanism
 * @type {String}
 */
var baseURL = "http://whelan-z800.jiveland.com:8080" + "/api/core/v3"; // value replaced when template is rendered

/**
 * Converts the passed object into a proper URL encoded property string.
 * @param params {Object} a map of name value pairs to build a query string
 *     from.
 * @param baseURL {String} (optional) the url to append this query string to.
 * @return {String} The query string, starting with "?", or "" if the object
 *     passed contained no properties.
 */
function buildQueryParams(params, baseURL) {
    if (params) {
        var q = [];
        for (var n in params) {
            if (params.hasOwnProperty(n)) {
                if (params[n] != null) {
                    if (params[n] instanceof Array) {
                        for (var a = params[n], i = 0; i < a.length; i++) {
                            if (a[i] != null) {
                                q.push([encodeURIComponent(n), encodeURIComponent(a[i])].join("="));
                            }
                        }
                    } else {
                        q.push([encodeURIComponent(n), encodeURIComponent(params[n])].join("="));
                    }
                } else {
                    q.push(encodeURIComponent(n));
                }
            }
        }
        if (baseURL && /\?/.test(baseURL)) {
            return q.length == 0 ? baseURL : baseURL + "&" + q.join("&");
        } else if (baseURL) {
            return q.length == 0 ? baseURL : baseURL + "?" + q.join("&");
        }
        return q.length == 0 ? "" : "?" + q.join("&");
    } else {
        return "";
    }
}

/**
 * Builds a function that will take an object containing potential query
 * parameters and provide a URL encoded query string containing only the
 * parameters permitted.
 * @param params {Object|Array} An object with keys for parameter names that are
 *     permitted in the formatted query string, or an array of strings.
 * @param hasFilter {Boolean} A flag indicating that remaining parameters
 *     should be treated as filter parameters.
 * @return {Function} A function that builds a query string, only containing
 *     acceptable parameters.
 */
function buildQueryParamFormatter(params, hasFilter) {
    if (params instanceof Array) {
        params = quickLookupFromArray(params);
    }
    if (hasFilter = Boolean(hasFilter && params.filter)) {
        delete params.filter;
    }
    return function(a, url) {
        var p = partitionObject(a,params);
        if (hasFilter && isObjectWithProperties(a)) {
            var filter = [];
            for (var k in a) {
                if (a.hasOwnProperty(k) && a[k] != null) {
                    var v = a[k] instanceof Array ? a[k].join(',') : String(a[k]);
                    filter.push(k + "(" + v + ")");
                }
            }
            if (filter.length) {
                p.filter = filter;
            }
        }
        return buildQueryParams(p, url);
    }
}

/**
 * Utility to trim the Jive URL from an href, making it a relative URL. This
 * function will prepend a "/" if one is not present.
 * @param ref {String} the url to trim
 * @return {String} the trimmed url
 */
function trimRef(ref) {
    var url = ext.jiveUrl ? ext.jiveUrl + "/api/core/v3" : baseURL;
    ref = ref.indexOf(url) == 0 ? ref.substring(url.length) : ref;
    if (/^https?:\/\//i.test(ref)) {
        return ref;
    }
    ref = ref.charAt(0) != "/" ? "/" + ref : ref;
    return ref;
}

/**
 * Parses a CXF path to find path parameter tokens in the string. If this
 * method is passed "/people/{personId}/following/{followerId}", it will return
 * ["personId","followerId"].
 * @param ep {String} the CXF path to parse
 * @return {Array} An array of strings, containing the tokens found in the
 *     passed path.
 */
function parseEndpointParams(ep) {
    var a = [], m = null;
    var re = /\{(\w+)\}/g;
    while (m = re.exec(ep)) {
        a.push(m[1]);
    }
    return a;
}

/**
 * Replaces path parameter tokens in a CXF path string
 * @param endpoint {String} A CXF path, possibly containing parameter tokens to
 *     be replaced.
 * @param p {Object} A map of values to replace in the passed endpoint string
 * @return {String} The path string, with parameter tokens replaced.
 */
function buildEndpoint(endpoint, p) {
    for (var k in p) {
        if (p.hasOwnProperty(k) && p[k] != null) {
            endpoint = endpoint.replace(new RegExp("\\{" + k + "\\}", "g"), encodeURIComponent(String(p[k])));
        }
    }
    return endpoint;
}

$e(Ext.prototype, {
    parseIdFromURI: function (options, args) {
        var re = new RegExp(options.endpoint.replace(/\{\w+}/g, '(\\d+)'));
        return idFromURI(options.endpoint, re, args, "uri");
    },
    placeIdFromURI: function (options, args) {
        return idFromURI('/places/{placeID}', /\/places\/(\d+)/, args, "placeURI");
    },
    contentIdFromURI: function (options, args) {
        return idFromURI('/contents/{contentID}', /\/contents\/(\d+)/, args, "uri");
    }
});

function idFromURI (expected, re, args, uriField) {
    if (args && args.id) {
        var out = $e({}, args);
        out[uriField] = args.id;
        delete args.id;
        return out;
    }
    else if (args && args[uriField]) {
        var result = re.exec(args[uriField]);
        if (result) {
            var out = $e({}, args);
            out[uriField] = result[1];
            return out;
        } else {
            throw "Passed URI does not match \"" + expected + "\": " + args.uri;
        }
    }
}

/*
 * Including JS template resource from base-class.js
 */

/**
 * Defines a class, with an optional super class.
 * @param className {String} The fully qualified class name to be created
 * @param superClass {Function} Optional constructor function of the new type's
 *     super class.
 * @param proto {Object} a prototype object, whose properties are added to
 *     every instance of this object that is created.
 * @param extraMethods {Array} an array of objects, defining methods to extend
 */
function defineClass(className, superClass, proto, extraMethods) { // define class
    $r(className, function() {
        var c = function() { // constructor
            if (!(this instanceof c)) {
                var newObj = defineClass.chain(c.prototype);
                c.apply(newObj, arguments);
                return newObj;
            }
            if (superClass) superClass.apply(this,arguments);
            if (proto) {
                $e(this, proto);
            }
        };
        if (typeof superClass === "function") {
            c.prototype = defineClass.chain(superClass.prototype);
        }
        c.prototype.toString = function() {
            return "function " + className + "() { [generated code] }";
        };
        c.prototype.constructor = c;
        if (extraMethods && extraMethods.length) {
            for (var i = 0, l = extraMethods.length; i < l; i++) {
                var fn = ext.getExtraMethod({
                    name: extraMethods[i].name,
                    params: extraMethods[i].params || {},
                    className: className,
                    ctor: c
                });
                if (typeof fn === "function") {
                    c.prototype[extraMethods[i].name] = fn;
                }
            }
        }
        return c;
    });
}

/**
 * Utility function to create a prototype replacement to extend a type hierarchy
 * @param $prototype {Object} The prototype of the super class constructor
 * @return {Object} a new prototype object to replace the sub class
 *     constructor's prototype with.
 */
defineClass.chain = (function () {
    var p = function (){};
    return function ($prototype) {
        p.prototype = $prototype;
        return new p();
    };
}());

/**
 * Returns the class name of the argument or undefined if
 * it's not a valid JavaScript object.
 * @param obj {Object} The object to derive the class name string from.
 * @return {String} the type of the passed object.
 */
function getObjectClass(obj) {
    if (obj && obj.constructor && obj.constructor.toString) {
        var arr = obj.constructor.toString().match(/function\s*([a-z$_][a-z0-9$_]*(\.[a-z$_][a-z0-9$_]*)*)/i);
        if (arr && arr.length == 2) {
            return arr[1];
        }
        return "unknown";
    }
    return typeof obj;
}

/**
 * Defines a property on an object. This call supports getter functions on
 * object prototypes and values <b>only</b>.
 *
 * The newly added property <i>may or may not</i> be enumerable, depending on
 * the capabilities of the underlying JavaScript engine.
 * @param object The object to add a property to.
 * @param name The name of the property to add.
 * @param config.get {Function} The getter function to apply.
 * @param config.value {*} The value to set.
 */
function defineProperty(object, name, config) {
    if (defineProperty.useDynamic) {
        // use the native language mechanism
        Object.defineProperty(object, name, config);
    } else if (object.constructor &&
               object.constructor.prototype == object &&
               typeof config.get === "function") {
        // this is a getter on a constructor prototype
        var getters = object.constructor._dynamicGetters || [];
        if (getters.length == 0) {
            object.constructor._dynamicGetters = getters;
        }
        getters.push($e({name: name, fn: config.get}, config));
    } else if (typeof object === "object" && config.hasOwnProperty("value")) {
        // this is simply setting a value on an object
        object[name] = config.value;
    } else {
        throw "unsupported use of defineProperty(object,'" + name + "'," + JSON.stringify(config) + ")";
    }
}

/**
 * Indicates if this javascript engine supports Object.defineProperty
 * @type {Boolean}
 */
defineProperty.useDynamic = (function() {
    var supportsDefineProperty = typeof Object.defineProperty === 'function';

    if(typeof document != "undefined"){
        // IE8 supports Object.defineProperty, but with a different API.
        var div = document.createElement('div');
        div.innerHTML = '<!--[if IE 8]><i></i><![endif]--><!--[if IE 9]><i></i><![endif]-->';
        if (div.getElementsByTagName('i').length > 0) {
            supportsDefineProperty = false;
        }
    }

    return supportsDefineProperty;
})();


    /**
     * Builds a member function extension for a class
     * @param options.name {String}
     * @param options.params {Object} A map
     * @param options.className {String} The fully qualified name of the class.
     * @param options.ctor {Function} The constructor function for the class.
     */

    Ext.prototype.getExtraMethod = function(options) {

        var name = options.name;
        if (options.params && options.params["for"]) {
            name += "_for" + options.params["for"];
        }
        return ext.extraMethods[name] || null;
    };

function defineFieldMetadata(name, type, entityType, editable, required, array){
    var ret =  {
        "name": name,
        "type": type,
        "editable": !!editable,
        "required": !!required,
        "array": !!array
    };
    if(entityType){
        ret["entityType"] = entityType;
    }
    return ret;
}
/*
 * Including JS template resource from base-static.js
 */

/**
 * Partitions override params for application to body and options arguments of
 * static methods.
 * @param ov {Object} The sum of all parameter overrides, to be partitioned.
 * @param ep {Object} A quick lookup for all values that are in the path.
 * @param qp {Object} A quick lookup for all values that are in passed options.
 * @param hasBody {Boolean} true if there really is a body, false otherwise.
 * @return An object with two properties, args & body, which contain override
 *     params for the args and body parameters.
 */
function buildOverrides(ov, ep, qp, hasBody) {
    if (hasBody) {
        return { args: partitionObject(ov, $e({}, ep, qp)), body: ov };
    } else {
        return { args: ov, body: {} };
    }
}

/**
 * Defines a static method that is implicitly tied to a REST endpoint. The method always returns a Request object.
 * @param options.name {String} defines where in the global namespace this method should go
 * @param options.httpMethod {String} one of: "GET", "PUT", POST", or "DELETE"
 * @param options.endpoint {String} defines the REST endpoint for this service
 * @param options.endpointParams {Array} (optional) args to replace in the endpoint path
 * @param options.ext {String} (optional) Specifies the core api extension in which this rest endpoint is defined
 * @param options.version {String} (optional) Specifies the version of the core api extension in which this rest endpoint is defined
 * @param options.queryParams {Array} (optional) args to pass in the query string
 * @param options.overrideParams {Object} (optional) args that are always set, overriding those explicitly specified
 * @param options.paramType {String} (optional) ensures the passed param implements this type
 * @param options.optionsInterceptor {String} (optional) an extension function to pre-process passed data
 */
function defineStatic(options) {
    if (!(options.name && options.httpMethod && options.endpoint)) {
        return;
    }
    options.endpointParams = options.endpointParams || parseEndpointParams(options.endpoint);
    var ep = quickLookupFromArray(options.endpointParams);
    var qp = quickLookupFromArray(options.queryParams || []);
    var qpf = buildQueryParamFormatter(options.queryParams || [], /^(GET)$/.test(options.httpMethod));
    var oi = options.optionsInterceptor && ext[options.optionsInterceptor];
    var hasBody = /^(PUT|POST)$/.test(options.httpMethod);
    var ov = buildOverrides(options.overrideParams, ep, qp, hasBody);

    var paramType;
    var f = $r(options.name, function() {
        return function(arg1, arg2) {
            var a = $e({}, hasBody ? arg2 : arg1);
            var o = hasBody ? arg1 : $u;
            for (var i = 0; i < f.overload.length; i++) {
                if (f.overload[i].optionsInterceptor) {
                    var a_ = f.overload[i].optionsInterceptor(a);
                    a = typeof(a_) == "undefined" ? a : a_;
                }
                if (f.overload[i].test(a)) {
                    var fn = f.overload[i].handle;
                    return hasBody ? fn(o,a) : fn(a);
                }
            }
            throw "Could not find a suitable signature for the passed arguments:\n\t" + f.overload.join("\n\t");
        };
    });
    f.overload = f.overload || [];
    f.overload.push({
        handle: function (arg1, arg2) {
            var a = applyOverrides(null, hasBody ? arg2 : arg1, ov.args);
            var o = {
                v: options.version ? "v" + options.version : "v3",
                href: qpf(a, buildEndpoint(options.endpoint, partitionObject(a,ep)))
            };
            if (options.ext) {
                o.ext = options.ext;
            }
            if (hasBody) {
                o.body = applyOverrides(null, arg1, ov.body);
            }
            return httpExecute(options.httpMethod, o);
        },
        test: function(arg) {
            for (var i = 0; i < options.endpointParams.length; i++) {
                if (options.overrideParams && options.overrideParams.hasOwnProperty(options.endpointParams[i])) {
                    continue; // override params don't count
                }
                if ((!arg.hasOwnProperty(options.endpointParams[i])) ||
                    arg[options.endpointParams[i]] == null) {
                    return false;
                }
            }
            return typeof this.validateParam === "function" ? this.validateParam(arg) : true;
        },
        validateParam: options.validate ? function(param) {
            if (typeof paramType === "undefined") {
                paramType = options.paramType ? $r(options.paramType, function(){ return $u; }) || null : null;
            }
            if (paramType) {
                if (!(param instanceof paramType)) {
                    return false;
                }
            }
            return true;
        } : null,
        name: (function() {
            var args = [];
            if (hasBody) {
                args.push("obj");
            }
            if (options.endpointParams.length) {
                args.push('{"' + options.endpointParams.join('":*, "') + '":*}');
            }
            return "(" + args.join(", ") + ")";
        })(),
        sort: options.endpointParams.length,
        optionsInterceptor: oi ? function(args) { return oi(options, args); } : $u,
        toString: function () {
            return this.name;
        }
    });
    f.overload.sort(function(l,r) {
        return (l = l.sort) < (r = r.sort) ? 1 : (l > r ? -1 : 0);
    });
}

/*
 * Including JS template resource from base-type.js
 */

// base constructor for all core types
defineClass("osapi.jive.corev3.AbstractObject");

// base constructor for all collections of core types
defineClass("osapi.jive.corev3.Collection");

/**
 * Extension for the Collection that adds the previousPage() convenience method
 * when a previous page exists.
 */
defineProperty(osapi.jive.corev3.Collection.prototype, "getNextPage", {
    get: function() {
        var l = this.links;
        var fn = $u; // undefined
        if (l && l.next) {
            fn = function() {
                return httpExecute("get", l.next);
            }
        }
        defineProperty(this, "getNextPage", { value: fn });
        return fn;
    }
});

/**
 * Extension for the Collection that adds the previousPage() convenience method
 * when a previous page exists.
 */
defineProperty(osapi.jive.corev3.Collection.prototype, "getPreviousPage", {
    get: function() {
        var l = this.links;
        var fn = $u; // undefined
        if (l && l.previous) {
            fn = function() {
                return httpExecute("get", l.previous);
            }
        }
        defineProperty(this, "getPreviousPage", { value: fn });
        return fn;
    }
});

/**
 * The registry object that will contain meta data about all known core API
 * types.
 * @type {Object}
 */
var typeRegistry = {};

/*
 * Including JS template resource from base-methods.js
 */

function ExtraMethods() {}
ext.extraMethods =$e(new ExtraMethods(), ext.extraMethods);

$e(ExtraMethods.prototype, {
    toURI: function () {
        return this.resources && this.resources.self && this.resources.self.ref;
    },
    toURI_forActivityEntity: function () {
        if (typeof this.url === "string") {
            var match = /streamentry\/(\d+)$/.exec(this.url);
            return match && match[1] ? "/streamEntries/" + match[1] : $u;
        }
    }
});

/**
 * Defines an instance method on an existing object prototype.
 * @param options.className {String} name of the constructor, as defined in the global namespace
 * @param options.methodName {String} name of the instance method
 * @param options.httpMethod {String} one of: "GET", "PUT", POST", or "DELETE"
 * @param options.resourceName {String} defines the REST endpoint for this service
 * @param options.hasBody {Boolean} (optional) set to false to prevent sending a body on PUT/POST operations
 * @param options.queryParams {Array} (optional) args to replace in the endpoint path
 * @param options.paramOverrides {Object} (optional) Values that are always overridden in the body
 * @param options.optionsInterceptor {String} (optional) an extension function to pre-process passed data
 */
function defineInstanceMethod(options) {
    var ctor = $r(options.className);
    var err = null;
    if (typeof ctor === "function" && /^(GET|PUT|POST|DELETE)$/.test(options.httpMethod)) {
        defineProperty(ctor.prototype, options.methodName, {
            get: function() {
                var r = this.resources;
                var fn = $u; // undefined
                var qp = options.queryParams && buildQueryParamFormatter(options.queryParams, false);
                var oi = options.optionsInterceptor && ext[options.optionsInterceptor];
                var intercept = oi ? function(args) { return oi(options, args); }
                                   : function(args) { return args; };
                var self = this;
                r = r && r[options.resourceName];
                if (r && arrayIndexOf(r.allowed, options.httpMethod) >= 0) {
                    switch (options.httpMethod) {
                        case "GET":
                            fn = function(params) {
                                return httpExecute("get", r.ref, intercept(params), qp, null);
                            };
                            break;
                        case "PUT":
                            if (options.hasBody === false) {
                                fn = function (params) {
                                    return httpExecute("put", r.ref, intercept(params), qp, null);
                                };
                            }
                            else {
                                fn = function (params) {
                                    var body = options.paramOverrides
                                               ? applyOverrides(self, $e({}, self), options.paramOverrides)
                                               : self;
                                    return httpExecute("put", r.ref, intercept(params), qp, body);
                                };
                            }
                            break;
                        case "POST":
                            if (options.hasBody === false) {
                                fn = function (params) {
                                    return httpExecute("post", r.ref, intercept(params), qp, null);
                                };
                            }
                            else {
                                fn = function (data, params) {
                                    var body = options.paramOverrides
                                               ? applyOverrides(self, data, options.paramOverrides)
                                               : data;
                                    return httpExecute("post", r.ref, intercept(params), qp, body);
                                };
                            }
                            break;
                        case "DELETE":
                            fn = function() {
                                return httpExecute("delete", r.ref, null, null, null);
                            };
                            break;
                    }
                }
                if (fn) {
                    defineProperty(this, options.methodName, { value:fn });
                }
                return fn;
            }
        });
    }
    else if (typeof ctor === "function") {
        err = "Unsupported http method: " + options.httpMethod;
    }
    else {
        err = "Unable to find a constructor named " + options.className;
    }
    if (err) {
        setTimeout(function(){
            throw err;
        }, 1);
    }
}


/***[ REST Adapter ]***\
*                       *******************************************************\
* Routines that define, extend or modify functions for invoking Jive's REST    *
* services and intercepting the returned data.                                 *
\******************************************************************************/

/*
 * Including JS template resource from rest-shindig-adapter.js
 *     jiveContext : "\"\""
 */

/**
 * This routine overlays Shindig's OSAPI methods to provide support for custom
 * Jive extensions that pre-process response data from the Core API before
 * being passed to user supplied callback functions.
 */
function interceptShindigOsapi() {

    var osapi = $r("osapi");
    var $newBatch = osapi.newBatch;

    osapi.newBatch = function() {
        var batch = $newBatch.apply(this, arguments);
        osapi.jive.corev3._extendOsapiBatchRequestWithResponseInterceptorSupport(batch);
        return batch;
    };

    function defer(fn) {
        return function () {
            var self = this;
            var args = arguments;
            ext.runWhenReady(function () {
                return fn.apply(self, args);
            });
        }
    }

    function intercept(interceptor, response) {
        if (interceptor.renderSilent === true) {
            return response;
        }
        return interceptor(response) || response;
    }

    osapi.jive = osapi.jive || {};
    osapi.jive.corev3 = osapi.jive.corev3 || {};
    $e(osapi.jive.corev3, {
        _extendOsapiRequestWithResponseInterceptor : function(request, responseInterceptor) {
            request._jive = request._jive || {};
            if (!request._jive.hasOwnProperty("responseInterceptor")) {
                if (request.execute._intercepted !== true) {
                    var $execute = request.execute;
                    request.execute = defer(function (callback) {
                        var di = this._jive.responseInterceptor;
                        if (di && di instanceof Function) {
                            var callbackIntercept = function (response) {
                                var args = Array.prototype.slice.call(arguments);
                                args[0] = intercept(di, response) || response;
                                return callback.apply(this, args);
                            };
                            var args = Array.prototype.slice.call(arguments);
                            args[0] = callbackIntercept;
                            return $execute.apply(this, args);
                        }
                        else {
                            return $execute.apply(this, arguments);
                        }
                    });
                    request.executeAs = function (personURI, callback) {
                        this.rpc.runAs = "uri " + personURI;
                        return this.execute(callback);
                    };
                    request.execute._intercepted = true;
                }
            }
            request._jive.responseInterceptor = responseInterceptor;
        },

        _buildRequestWithStaticResponse : function(response) {
            return {
                _jive: {
                    staticResponse:response
                },
                execute: function(callback) {
                    callback(response);
                }
            };
        },

        _buildRequestWithStaticErrorResponse : function(message) {
            return this._buildRequestWithStaticResponse(osapi.jive.core._createErrorResponse({
                message: message
            }));
        },

        _extendOsapiBatchRequestWithResponseInterceptorSupport : function(request) {
            if (request.add._intercepted !== true) {
                var $add = request.add;
                request.add = function(key, request) {
                    this._jive = this._jive || {requestCount:0};
                    var di = request._jive && request._jive.responseInterceptor;
                    if (di && di instanceof Function) {
                        this._jive.diContainer = this._jive.diContainer || [];
                        var diContainer = this._jive.diContainer;
                        diContainer.push({ key: key, responseInterceptor: di, request: request });
                    }
                    var sr = request._jive && request._jive.staticResponse;
                    if (sr) {
                        this._jive = this._jive || {};
                        this._jive.srContainer = this._jive.srContainer || {};
                        var srContainer = this._jive.srContainer;
                        srContainer[key] = sr;
                    } else {
                        this._jive.requestCount++;
                        return $add.apply(this, arguments);
                    }
                };
                request.add._intercepted = true;
            }

            if (request.execute._intercepted !== true) {
                var $execute = request.execute;
                request.execute = defer( function (callback) {
                    if (this._jive && this._jive.diContainer && this._jive.diContainer.length) {
                        var diContainer = this._jive.diContainer;
                        var srContainer = this._jive.srContainer || {};
                        var callbackIntercept = function (response) {
                            var restore = [];
                            for (var i = 0, l = diContainer.length; i < l; ++i) {
                                var key = diContainer[i].key;
                                if (response.hasOwnProperty(key) && response[key]) {
                                    var content = response[key];
                                    if (content) {
                                        var di = diContainer[i].responseInterceptor;
                                        var req = diContainer[i].request;
                                        content = intercept(di, content) || content;
                                        // hide the interceptor on the request to
                                        // prevent it from being called twice
                                        req._jive.responseInterceptor.renderSilent = true;
                                        restore.push(req._jive.responseInterceptor);
                                        response[key] = content;
                                    }
                                }
                            }
                            for (var k in srContainer) {
                                if (srContainer.hasOwnProperty(k)) {
                                    response[k] = srContainer[k];
                                }
                            }
                            var args = Array.prototype.slice.call(arguments);
                            args[0] = response;
                            try {
                                var result = callback.apply(this, args);
                                restoreSilence();
                            }
                            catch (e) {
                                restoreSilence(); // because IE is dumb
                                throw e;
                            }
                            function restoreSilence() {
                                for (i = 0, l = restore.length; i < l; ++i) {
                                    // restore the interceptor on the request so that it
                                    // may be used again
                                    delete restore[i].renderSilent;
                                }
                            }

                            return result;
                        };
                        var args = Array.prototype.slice.call(arguments);
                        args[0] = callbackIntercept;
                        return $execute.apply(this, args);
                    }
                    else if (this._jive && this._jive.srContainer) {
                        // pure static response
                        callback(this._jive.srContainer)
                    }
                    else {
                        $execute.apply(this, arguments)
                    }
                });
                request.executeAs = function (personURI, callback) {
                    this.rpc.runAs = "uri " + personURI;
                    return this.execute(callback);
                };
                request.execute._intercepted = true;
            }
        }

    });

    function interceptJiveCoreRestCall(propertyName) {
        var fn = osapi.jive.core[propertyName];
        if (typeof fn === "function" && fn._intercepted !== true) {
            osapi.jive.core[propertyName] = function () {
                var req = fn.apply(osapi.jive.core, arguments);
                if (req) {
                    osapi.jive.corev3._extendOsapiRequestWithResponseInterceptor(req,
                        function() {
                            return osapi.jive.corev3._interceptData.apply(this, arguments);
                        });
                }
                return req;
            };
            osapi.jive.core[propertyName]._intercepted = true;
        }
    }

    initIntercept = function() {
        if (osapi.jive.core) {
            interceptJiveCoreRestCall("get");
            interceptJiveCoreRestCall("put");
            interceptJiveCoreRestCall("post");
            interceptJiveCoreRestCall("delete");
        }
        if (typeof opensocial === "object" && opensocial.data && opensocial.data.getDataContext && opensocial.data.getDataContext._intercepted !== true) {
            var $dataContext = opensocial.data.getDataContext;
            opensocial.data.getDataContext = function() {
                var ctx = $dataContext.apply(this, arguments);
                if ( ctx.getDataSet._intercepted !== true ) {
                    $getDataSet = ctx.getDataSet;
                    ctx.getDataSet = function() {
                        return interceptData($getDataSet.apply(this, arguments));
                    };
                    ctx.getDataSet._intercepted = true;
                }
                return ctx;
            };
            opensocial.data.getDataContext._intercepted = true;
        }
    };

    registerOnLoadHandler(initIntercept);

}

/*
 * Including JS template resource from rest-jquery-adapter.js
 *     jiveContext : "\"\""
 */

/**
 * This function defines an osapi-like extension to communicate with Jive's
 * REST services using jQuery to perform the ajax operations.
 */
function createJQueryRestAdapter (){
    // use jQuery to contact the Jive server

    var ajaxPath = ""; // value replaced when template is rendered
    var osapi = $r("osapi");

    var dataFilter = function(data, type) {
        return (type === 'json' && data) ? jQuery.trim(data.replace(/^throw [^;]*;/, '')) : data;
    };

    /**
     * @param options.method {String} one of "GET", "PUT", "POST" or "DELETE"
     * @param options.endpoint {String} the short REST path, e.g.: "users/1234?"
     * @param options.queryParams {Object} map of query params to their values
     * @param options.body {String} body content to send with PUT or POST
     * @constructor
     */
    osapi.Request = function(options) {
        this.options = {
            method: options.method,
            endpoint: options.endpoint,
            ext: options.ext,
            v: options.v
        };
        if (isObjectWithProperties(options.queryParams)) {
            this.options.queryParams = options.queryParams
        }
        if (options.body != null) {
            this.options.body = options.body
        }
    };
    osapi.Request.prototype.execute = function(callback, requestContext) {
        executeImpl.call(this, null, callback, requestContext);
    };
    osapi.Request.prototype.executeAs = function(personURI, callback, requestContext) {
        executeImpl.call(this, "uri " + personURI, callback, requestContext);
    };
    function executeImpl(runAs, callback, requestContext) {
        callback = callback || function(){};
        var endpoint = this.options.endpoint + buildQueryParams(this.options.queryParams);
        if (endpoint.charAt(0) == '/') {
            endpoint = endpoint.substring(1);
        }
        var beforeSend = jQuery.noop;
        if(requestContext){
            ajaxPath = requestContext.jiveUrl;
            beforeSend = requestContext.beforeSend;
        }
        var path = "v3";
        if(this.options.ext){
            path = "ext/" + this.options.ext + "/" + (this.options.version || this.options.v);
        }
        var url = [ajaxPath, "api/core", path, endpoint].join("/");
        jQuery.ajax({
            url: url,
            type: this.options.method,
            contentType: this.options.body == null ? $u : "application/json",
            data: this.options.body == null ? $u : this.options.body,
            dataType: "json",
            dataFilter: dataFilter,
            beforeSend: function(req) {
                if (runAs != null) {
                    req.setRequestHeader("X-Jive-Run-As", runAs);
                }
                beforeSend.call(this, req);
            },
            success: function(data, textStatus, jqXHR) {
                if(data === null) {
                    data = { status : jqXHR.status };
                }
                callback(interceptData(data));
            },
            error: function(xhr) {
                callback(buildErr(500, xhr.status, "An error occurred while contacting the server"));
            }
        });
    }

    /**
     * Object that may contain several Request objects to be executed in a
     * single REST call.
     * @constructor
     */
    osapi.BatchRequest = function() {
        this._requests = [];
    };
    osapi.BatchRequest.prototype.add = function(key, request) {
        if (this._requests == null) {
            throw "BatchRequest is no longer valid";
        }
        this._requests.push({
            key: key,
            request: request.options
        });
    };
    osapi.BatchRequest.prototype.execute = function(callback, requestContext) {
        executeBatchImpl.call(this, null, callback, requestContext);
    };
    osapi.BatchRequest.prototype.executeAs = function(personURI, callback, requestContext) {
        executeBatchImpl.call(this, "uri " + personURI, callback, requestContext);
    };
    function executeBatchImpl(runAs, callback, requestContext) {
        if (this._requests == null) {
            throw "BatchRequest is no longer valid";
        }
        var req = this._requests;
        this._requests = null;
        callback = callback || function(){};
        if (req.length == 0) {
            callback({});
            return;
        }
        var beforeSend = jQuery.noop;
        if(requestContext){
            ajaxPath = requestContext.jiveUrl;
            beforeSend = requestContext.beforeSend;
        }
        var url = [ajaxPath, "api/core/v3/executeBatch"].join("/");
        jQuery.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(req),
            dataType: "json",
            dataFilter: dataFilter,
            beforeSend: function(req) {
                if (runAs != null) {
                    req.setRequestHeader("X-Jive-Run-As", runAs);
                }
                beforeSend.call(this, req);
            },
            success: function(res) {
                var data = {}, i;
                for (i = 0; i < res.length; i++) {
                    if (res[i].data) {
                        data[res[i].id] = interceptData(res[i].data);
                    } else if (res[i].error) {
                        data[res[i].id] = buildErr(res[i].error.code || 500, res[i].status || 500, res[i].error.message);
                    }
                }
                for (i = 0; i < req.length; i++) {
                    if (!(data.hasOwnProperty(req[i].id) && data[req[i].id])) {
                        data[req[i].id] = buildErr(500, 500, "No data was returned from the server");
                    }
                }
                callback(data);
            },
            error: function(xhr) {
                var res = {};
                try {
                    res = JSON.parse(xhr.responseText) || {};
                } catch (e) { /* don't care */ }
                var data = {};
                var err = buildErr(res.code || 500, xhr.status, res.message || "An error occurred while contacting the server");
                for (var i = 0; i < req.length; i++) {
                    data[req[i].key] = err;
                }
                callback(data);
            }
        });
    }

    /**
     * Creates a new, empty BatchRequest
     * @return {osapi.BatchRequest}
     */
    osapi.newBatch = function() {
        return new osapi.BatchRequest();
    };

    function buildErr(code, status, msg) {
        return {
            error: {
                code: code,
                status: status,
                message: msg
            }
        };
    }

    function buildRequest(method, hasBody, options) {
        var o = {
            method: method,
            endpoint: options.href,
            queryParams: options.params
        };
        if (hasBody) {
            o.body = options.body == null ? "" : JSON.stringify(options.body);
        }
        if (options.ext) {
            o.ext = options.ext;
            o.v = options.v;
        }
        return new osapi.Request(o);
    }

    $r("osapi.jive.core", function() { return {
        "get": function(options) {
            return buildRequest("GET", false, options);
        },
        "post": function(options) {
            return buildRequest("POST", true, options);
        },
        "put": function(options) {
            return buildRequest("PUT", true, options);
        },
        "delete": function(options) {
            return buildRequest("DELETE", false, options);
        }
    }});

    osapi.jive.core["get"]._intercepted = true;
    osapi.jive.core["put"]._intercepted = true;
    osapi.jive.core["post"]._intercepted = true;
    osapi.jive.core["delete"]._intercepted = true;

    initIntercept = bootstrapRest;
}

/*
 * Including JS template resource from rest-interceptor.js
 *     jiveContext : "\"\""
 */

/**
 * Get the nested fields for the object that would be created by the passed
 * constructor.
 * @param ctor The constructor function.
 */
function getNestedFields(ctor) {
    var nestedFields = ctor.nestedFields;
    if (!nestedFields) {
        nestedFields = [];
        if (ctor.fields) {
            for (var i = 0; i < ctor.fields.length; i++) {
                if (ctor.fields[i].entityType) {
                    nestedFields.push(ctor.fields[i]);
                }
            }
        }
        ctor.nestedFields = nestedFields;
    }
    return nestedFields;
}

/**
 * Guesses the type of the passed plain object using defined properties
 * @param obj The object to guess the type of.
 * @return {String} A string identifying the most likely entity type.
 */
function duckType(obj) {
    if (typeof obj.content === "object" &&
        typeof obj.resources === "undefined" &&
        typeof obj.list === "undefined" &&
        typeof obj.provider === "undefined" &&
        duckType(obj.content) !== "unknown") {
        return "data-wrapper";
    }
    if (typeof obj.actor === "object" &&
        typeof obj.provider === "object" &&
        typeof obj.verb === "string") {
        return "activity";
    }
    if (typeof obj.resources === "object") {
        if (typeof obj.type === "string") {
            return obj.type;
        }
        return "entity";
    }
    if (typeof obj.list === "object" &&
        obj.list instanceof Array) {
        return "entities";
    }
    return "unknown";
}

/**
 * Utility to intercept returned data and apply the correct types to it.
 * @param data {Object} the data to intercept and decorate with the proper type
 *     hierarchy and convenience methods.
 * @param forceType {String} the type to decorate this data as
 *     hierarchy and convenience methods.
 * @return {Object} the object to replace the original object.
 */
function interceptData(data, forceType) {
    if (typeof data === "object") {
        if(data === null) {
            return {};
        }
        if (data.error) {
            return data;
        }
        if (duckType(data) === "data-wrapper") {
            data = data.content;
        }
        var ctor = null;
        var init = null;
        if ((forceType && typeRegistry[forceType] && typeRegistry[forceType].ctor && typeof data.resources === "object") ||
            (typeof data.type === "string" && typeof data.resources === "object")) {
            ctor = (forceType && typeRegistry[forceType] && typeRegistry[forceType].ctor) ||
                (typeRegistry[data.type] && typeRegistry[data.type].ctor);
            function interceptSingle(obj, field, type) {
                if (type === "any") {
                    obj[field] = interceptData(obj[field], $u);
                }
                else if (typeRegistry[type] && typeRegistry[type].ctor) {
                    obj[field] = interceptData(obj[field], type);
                }
            }
            init = function() {
                var nestedFields = getNestedFields(ctor);
                for (var i = 0, l = nestedFields.length; i < l; i++) {
                    var field = nestedFields[i];
                    if (!(field.entityType && this[field.name])) {
                        continue;
                    }
                    if (field.array === true) {
                        var array = this[field.name];
                        if (array.length) {
                            for (var j = 0; j < array.length; j++) {
                                interceptSingle(array, j, field.entityType);
                            }
                        }
                    }
                    else {
                        interceptSingle(this, field.name, field.entityType);
                    }
                }
            }
        }
        else if (duckType(data) == "entities") {
            ctor = osapi.jive.corev3.Collection;
            init = function() {
                for (var i = 0, l = this.list.length; i < l; i++) {
                    this.list[i] = interceptData(this.list[i], forceType);
                }
            }
        }
        else if (duckType(data) == "activity" && typeRegistry.activity && typeRegistry.activity.ctor) {
            ctor = typeRegistry.activity.ctor;
        }
        if (typeof ctor === "function") {
            data = $e(new ctor(), data);
            if (init) {
                init.call(data);
            }
            if (ctor._dynamicGetters) {
                for (var j = 0, k = ctor._dynamicGetters.length; j < k; j++) {
                    var getter = ctor._dynamicGetters[j];
                    var value = getter.fn.call(data);
                    if (typeof value !== "undefined") {
                        defineProperty(data, getter.name, {value:value});
                    }
                }
            }
        }
    }
    return data;
}

$r("osapi.jive.corev3._interceptData", function() {
    return interceptData;
});

/*
 * Including JS template resource from rest-main.js
 *     jiveContext : "\"\""
 */

var initIntercept;

/**
 * Decide which rest adapter to use, then wire it up
 */
function bootstrapRest() {
    initIntercept = function(){};
    if ($w.osapi && $w.osapi.newBatch) {
        interceptShindigOsapi(); // the rest adapter is already defined, just intercept the data
    } else if (jQuery && jQuery.ajax) {
        createJQueryRestAdapter(); // no rest adapter is available, use jQuery to build one
    } else {
        setTimeout(function() {
            // record the error, but don't break the rest of the page
            throw "Unable to build a REST transport for the Jive Core API v3: jQuery was not found";
        }, 1);
    }
}
bootstrapRest();

/**
 * Universal http request function used by the core v3 JS framework. It ensures
 * that data interceptors are in place before executing the call.
 * @param method {String} "get", "put", "post", or "delete", case insensitive.
 * @param uri {String} The uri to be invoked
 * @param queryParams {Object} (optional) Query parameters to pass along
 * @param paramFormatter {Function} (optional) function to format query params
 * @param body {Object} (optional) the request body to pass long
 * @return {Request} The Request object that may be executed or
 */
function httpExecute(method, uri, queryParams, paramFormatter, body) {
    var data;
    if (typeof uri === "string") {
        var extension = /\/api\/core\/ext\/([^\/]+)\/(v[^\/]+)\/(.*)/.exec(uri);
        data = extension ? {
            ext: extension[1],
            v: extension[2],
            href: "/" + extension[3]
        } : {
            v: "v3",
            href: trimRef(uri)
        };
        if (queryParams) {
            data.params = queryParams;
            if (paramFormatter) {
                data.href = paramFormatter(queryParams, data.href);
            }
        }
        if (body) {
            data.body = body;
        }
    }
    else {
        data = uri;
    }
    var fn = null;
    if (/^(get|put|post|delete)$/i.test(method)) {
        fn = osapi.jive.core[method.toLowerCase()];
        if (fn._intercepted !== true) {
            initIntercept();
            fn = osapi.jive.core[method.toLowerCase()];
        }
        if (fn._intercepted !== true) {
            setTimeout(function() {
                // record the error, but don't break the rest of the page
                throw "Failed to initialize request interceptor!";
            }, 1);
        }
    }
    return fn(data);
}

/**
 * Given a URI for a Core v3 resource, fetches the full resource.
 *
 * Example:
 *
 *     var ref = someDoc.resources.attachments.ref;
 *     osapi.jive.corev3.getObject(ref).execute(function(response) {
 *         // ...
 *     });
 */
$r('osapi.jive.corev3.getObject', function() {
    return function(uri) {
        return httpExecute('get', uri);
    };
});
/*
 * Including JS template resource from before-definitions.js
 */

/**
 * Look for an extension point that needs the be run before any of the static
 * methods or classes are defined.
 */
if (typeof ext.runBeforeDefinitions === "function") {
    ext.runBeforeDefinitions();
}


/***[ Static Methods ]***\
*                         *****************************************************\
* Static method definitions derived from @StaticJavaScriptMethod annotations   *
* on the REST service classes                                                  *
\******************************************************************************/

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.contents.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.contents.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.contents.get"
 *     options : "count, fields, sort, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, sort, startIndex
 */ /*

osapi.jive.corev3.contents.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.get",
    "endpoint": "/contents"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.contents.getPopularContent"
 *     options : "fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields
 */ /*

osapi.jive.corev3.contents.getPopularContent = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.getPopularContent",
    "endpoint": "/contents/popular"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\"\n..."
 *     methodName : "osapi.jive.corev3.contents.getRecommendedContent"
 *     options : "count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields
 */ /*

osapi.jive.corev3.contents.getRecommendedContent = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.getRecommendedContent",
    "endpoint": "/contents/recommended"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"filter\",..."
 *     methodName : "osapi.jive.corev3.contents.getTrendingContent"
 *     options : "count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields
 */ /*

osapi.jive.corev3.contents.getTrendingContent = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.getTrendingContent",
    "endpoint": "/contents/trending"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "?"
 *     methodName : "osapi.jive.corev3.contents.create"
 */

/**
 * Defines a static updater method
 * @param ? {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.contents.create = function(?) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.contents.create",
    "endpoint": "/contents"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.places.get"
 *     options : "count, fields, sort, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, sort, startIndex
 */ /*

osapi.jive.corev3.places.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.places.get",
    "endpoint": "/places"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\"\n..."
 *     methodName : "osapi.jive.corev3.places.getRecommendedPlaces"
 *     options : "count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields
 */ /*

osapi.jive.corev3.places.getRecommendedPlaces = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.places.getRecommendedPlaces",
    "endpoint": "/places/recommended"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\"\n..."
 *     methodName : "osapi.jive.corev3.places.getTrendingPlaces"
 *     options : "count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields
 */ /*

osapi.jive.corev3.places.getTrendingPlaces = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.places.getTrendingPlaces",
    "endpoint": "/places/trending"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.places.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.places.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.places.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/places/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "?"
 *     methodName : "osapi.jive.corev3.places.create"
 */

/**
 * Defines a static updater method
 * @param ? {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.places.create = function(?) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.places.create",
    "endpoint": "/places"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.contents.search"
 *     options : "collapse, count, fields, sort, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     collapse, count, fields, sort, startIndex
 */ /*

osapi.jive.corev3.contents.search = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields",
        "collapse"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.search",
    "endpoint": "/search/contents"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.people.search"
 *     options : "count, fields, sort, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, sort, startIndex
 */ /*

osapi.jive.corev3.people.search = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.search",
    "endpoint": "/search/people"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.places.search"
 *     options : "collapse, count, fields, sort, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     collapse, count, fields, sort, startIndex
 */ /*

osapi.jive.corev3.places.search = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields",
        "collapse"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.places.search",
    "endpoint": "/search/places"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"cou..."
 *     methodName : "osapi.jive.corev3.search.byExtProp"
 *     options : "count, fields, key, startIndex, value"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, key, startIndex, value
 */ /*

osapi.jive.corev3.search.byExtProp = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.search.byExtProp",
    "endpoint": "/extprops/{key}/{value}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"cou..."
 *     methodName : "osapi.jive.corev3.search.byExtPropKey"
 *     options : "count, fields, key, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, key, startIndex
 */ /*

osapi.jive.corev3.search.byExtPropKey = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.search.byExtPropKey",
    "endpoint": "/extprops/{key}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"count\",\n..."
 *     methodName : "osapi.jive.corev3.activities.get"
 *     options : "after, before, count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     after, before, count, fields
 */ /*

osapi.jive.corev3.activities.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "after",
        "count",
        "before",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.activities.get",
    "endpoint": "/activities"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "activity"
 *     methodName : "osapi.jive.corev3.activities.create"
 */

/**
 * Defines a static updater method
 * @param activity {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.activities.create = function(activity) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.activities.create",
    "endpoint": "/activities"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"count\",\n..."
 *     methodName : "osapi.jive.corev3.communications.get"
 *     options : "after, before, count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     after, before, count, fields
 */ /*

osapi.jive.corev3.communications.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "after",
        "count",
        "before",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.communications.get",
    "endpoint": "/streams/connections/activities"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.jiveProperties.get"
 *     options : "fields, name"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, name
 */ /*

osapi.jive.corev3.jiveProperties.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.jiveProperties.get",
    "endpoint": "/admin/properties/{name}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "jiveProperty"
 *     methodName : "osapi.jive.corev3.jiveProperties.create"
 */

/**
 * Defines a static updater method
 * @param jiveProperty {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.jiveProperties.create = function(jiveProperty) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.jiveProperties.create",
    "endpoint": "/admin/properties"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"cou..."
 *     methodName : "osapi.jive.corev3.jiveProperties.get"
 *     options : "count, fields, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, startIndex
 */ /*

osapi.jive.corev3.jiveProperties.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.jiveProperties.get",
    "endpoint": "/admin/properties"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.plugins.get"
 *     options : "fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields
 */ /*

osapi.jive.corev3.plugins.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.plugins.get",
    "endpoint": "/admin/plugins"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"cou..."
 *     methodName : "osapi.jive.corev3.securityGroups.get"
 *     options : "count, fields, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, startIndex
 */ /*

osapi.jive.corev3.securityGroups.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.securityGroups.get",
    "endpoint": "/securityGroups"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.securityGroups.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.securityGroups.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.securityGroups.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/securityGroups/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.securityGroups.get"
 *     options : "fields, name"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, name
 */ /*

osapi.jive.corev3.securityGroups.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.securityGroups.get",
    "endpoint": "/securityGroups/name/{name}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "securityGroup"
 *     methodName : "osapi.jive.corev3.securityGroups.create"
 */

/**
 * Defines a static updater method
 * @param securityGroup {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.securityGroups.create = function(securityGroup) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.securityGroups.create",
    "endpoint": "/securityGroups"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"count\",\n..."
 *     methodName : "osapi.jive.corev3.actions.get"
 *     options : "actions, after, before, body, count, entryState, entrySub..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     actions, after, before, body, count, entryState, entrySubtype, entryType, fields, id, properties, published, requestMessage, resources, summary, target, title, type
 */ /*

osapi.jive.corev3.actions.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "after",
        "count",
        "before",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.actions.get",
    "endpoint": "/actions"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.actions.get"
 *     options : "fields, id"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, id
 */ /*

osapi.jive.corev3.actions.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.actions.get",
    "endpoint": "/actions/{id}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.actions.get.counts"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.actions.get.counts = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.actions.get.counts",
    "endpoint": "/actions/counts"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.dms.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.dms.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.dms.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/dms/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "dm"
 *     methodName : "osapi.jive.corev3.dms.create"
 */

/**
 * Defines a static updater method
 * @param dm {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.dms.create = function(dm) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.dms.create",
    "endpoint": "/dms",
    "overrideParams": {"type": "dm"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"count\",\n..."
 *     methodName : "osapi.jive.corev3.inboxEntries.get"
 *     options : "actor, after, before, content, count, fields, generator, ..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     actor, after, before, content, count, fields, generator, icon, id, jive, object, openSocial, provider, published, resources, target, title, updated, url, verb, viewCount
 */ /*

osapi.jive.corev3.inboxEntries.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "after",
        "count",
        "before",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.inboxEntries.get",
    "endpoint": "/inbox"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.inboxEntries.get.counts"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.inboxEntries.get.counts = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.inboxEntries.get.counts",
    "endpoint": "/inbox/counts"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.mentions.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.mentions.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.mentions.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/mentions/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.shares.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.shares.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.shares.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/shares/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "share"
 *     methodName : "osapi.jive.corev3.shares.create"
 */

/**
 * Defines a static updater method
 * @param share {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.shares.create = function(share) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.shares.create",
    "endpoint": "/shares",
    "overrideParams": {"type": "share"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"activeOnly\",\n        \"sta..."
 *     methodName : "osapi.jive.corev3.announcements.get"
 *     options : "activeOnly, count, expiredQuery, fields, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     activeOnly, count, expiredQuery, fields, startIndex
 */ /*

osapi.jive.corev3.announcements.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "activeOnly",
        "startIndex",
        "count",
        "fields",
        "expiredQuery"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.announcements.get",
    "endpoint": "/announcements"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.announcements.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.announcements.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.announcements.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/announcements/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\n        \"minor\",\n        \"fields\"\n..."
 *     paramName : "announcement"
 *     methodName : "osapi.jive.corev3.announcements.create"
 */

/**
 * Defines a static updater method
 * @param announcement {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.announcements.create = function(announcement) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "minor",
        "fields"
    ],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.announcements.create",
    "endpoint": "/announcements",
    "overrideParams": {"type": "announcement"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.attachments.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.attachments.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.attachments.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/attachments/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.comments.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.comments.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.comments.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/comments/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.comments.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.comments.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.comments.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/comments/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.discussions.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.discussions.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.discussions.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.discussions.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.discussions.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.discussions.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.discussions.get"
 *     options : "answer, attachments, author, authors, authorship, categor..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     answer, attachments, author, authors, authorship, categories, content, count, fields, followerCount, helpful, highlightBody, highlightSubject, highlightTags, id, likeCount, onBehalfOf, outcomeTypeNames, parent, parentContent, parentPlace, published, question, replyCount, resolved, resources, restrictReplies, sort, startIndex, status, subject, tags, type, updated, users, via, viewCount, visibility, visibleToExternalContributors
 */ /*

osapi.jive.corev3.discussions.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.discussions.get",
    "endpoint": "/contents",
    "overrideParams": {"type": "discussion"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "discussion"
 *     methodName : "osapi.jive.corev3.discussions.create"
 */

/**
 * Defines a static updater method
 * @param discussion {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.discussions.create = function(discussion) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.discussions.create",
    "endpoint": "/contents",
    "overrideParams": {"type": "discussion"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.documents.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.documents.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.documents.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.documents.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.documents.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.documents.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.documents.get"
 *     options : "approvers, attachments, author, authors, authorship, cate..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     approvers, attachments, author, authors, authorship, categories, content, count, editingBy, fields, followerCount, fromQuest, highlightBody, highlightSubject, highlightTags, id, likeCount, outcomeTypeNames, parent, parentContent, parentPlace, published, replyCount, resources, restrictComments, sort, startIndex, status, subject, tags, type, updated, updater, users, viewCount, visibility, visibleToExternalContributors
 */ /*

osapi.jive.corev3.documents.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.documents.get",
    "endpoint": "/contents",
    "overrideParams": {"type": "document"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "document"
 *     methodName : "osapi.jive.corev3.documents.create"
 */

/**
 * Defines a static updater method
 * @param document {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.documents.create = function(document) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.documents.create",
    "endpoint": "/contents",
    "overrideParams": {"type": "document"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.favorites.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.favorites.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.favorites.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.favorites.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.favorites.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.favorites.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.favorites.get"
 *     options : "author, content, count, favoriteObject, fields, followerC..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     author, content, count, favoriteObject, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, parent, parentContent, parentPlace, private, published, replyCount, resources, sort, startIndex, status, subject, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.favorites.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.favorites.get",
    "endpoint": "/contents",
    "overrideParams": {"type": "favorite"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "favorite"
 *     methodName : "osapi.jive.corev3.favorites.create"
 */

/**
 * Defines a static updater method
 * @param favorite {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.favorites.create = function(favorite) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.favorites.create",
    "endpoint": "/contents",
    "overrideParams": {"type": "favorite"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.polls.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.polls.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.polls.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.polls.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.polls.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.polls.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.polls.get"
 *     options : "author, authors, authorship, categories, content, count, ..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     author, authors, authorship, categories, content, count, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, options, outcomeTypeNames, parent, parentContent, parentPlace, published, replyCount, resources, sort, startIndex, status, subject, tags, type, updated, users, viewCount, visibility, visibleToExternalContributors, voteCount, votes
 */ /*

osapi.jive.corev3.polls.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.polls.get",
    "endpoint": "/contents",
    "overrideParams": {"type": "poll"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "poll"
 *     methodName : "osapi.jive.corev3.polls.create"
 */

/**
 * Defines a static updater method
 * @param poll {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.polls.create = function(poll) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.polls.create",
    "endpoint": "/contents",
    "overrideParams": {"type": "poll"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.posts.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.posts.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.posts.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.posts.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.posts.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.posts.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.posts.get"
 *     options : "attachments, author, categories, content, count, fields, ..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     attachments, author, categories, content, count, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, outcomeTypeNames, parent, parentContent, parentPlace, permalink, publishDate, published, replyCount, resources, restrictComments, sort, startIndex, status, subject, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.posts.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.posts.get",
    "endpoint": "/contents",
    "overrideParams": {"type": "post"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "post"
 *     methodName : "osapi.jive.corev3.posts.create"
 */

/**
 * Defines a static updater method
 * @param post {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.posts.create = function(post) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.posts.create",
    "endpoint": "/contents",
    "overrideParams": {"type": "post"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.tasks.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.tasks.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.tasks.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.tasks.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.tasks.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.tasks.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/contents/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.tasks.get"
 *     options : "author, completed, content, count, dueDate, fields, follo..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     author, completed, content, count, dueDate, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, owner, parent, parentContent, parentPlace, parentTask, published, replyCount, resources, sort, startIndex, status, subject, subTasks, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.tasks.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.tasks.get",
    "endpoint": "/contents",
    "overrideParams": {"type": "task"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "task"
 *     methodName : "osapi.jive.corev3.tasks.create"
 */

/**
 * Defines a static updater method
 * @param task {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.tasks.create = function(task) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.tasks.create",
    "endpoint": "/contents",
    "overrideParams": {"type": "task"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.urls.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.urls.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.urls.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/urls/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.messages.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.messages.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.messages.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/messages/{uri}/editable"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.messages.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.messages.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.messages.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/messages/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"cou..."
 *     methodName : "osapi.jive.corev3.outcomes.get"
 *     options : "count, creationDate, fields, followerCount, id, likeCount..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, creationDate, fields, followerCount, id, likeCount, note, outcomeType, parent, predecessorOutcome, properties, published, resources, startIndex, status, successorOutcomeTypes, tags, type, updated, user
 */ /*

osapi.jive.corev3.outcomes.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.outcomes.get",
    "endpoint": "/outcomes"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.outcomes.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.outcomes.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.outcomes.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/outcomes/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"cou..."
 *     methodName : "osapi.jive.corev3.slides.get"
 *     options : "count, fields, filters, startIndex"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields, filters, startIndex
 */ /*

osapi.jive.corev3.slides.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "count",
        "filters",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.slides.get",
    "endpoint": "/slides"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.slides.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.slides.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.slides.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/slides/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "slide"
 *     methodName : "osapi.jive.corev3.slides.create"
 */

/**
 * Defines a static updater method
 * @param slide {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.slides.create = function(slide) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.slides.create",
    "endpoint": "/slides",
    "overrideParams": {"type": "slide"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.streamEntries.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.streamEntries.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.streamEntries.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/streamEntries/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getAvailableLocaleMetadata"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.metadata.getAvailableLocaleMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getAvailableLocaleMetadata",
    "endpoint": "/metadata/locales/available"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getSupportedLocaleMetadata"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.metadata.getSupportedLocaleMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getSupportedLocaleMetadata",
    "endpoint": "/metadata/locales/supported"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.metadata.getAllObjectMetadata"
 *     options : "fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields
 */ /*

osapi.jive.corev3.metadata.getAllObjectMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getAllObjectMetadata",
    "endpoint": "/metadata/objects/@all"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getFieldMetadata"
 *     options : "field, name"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     field, name
 */ /*

osapi.jive.corev3.metadata.getFieldMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getFieldMetadata",
    "endpoint": "/metadata/objects/{name}/{field}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getObjectMetadata"
 *     options : "name"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     name
 */ /*

osapi.jive.corev3.metadata.getObjectMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getObjectMetadata",
    "endpoint": "/metadata/objects/{name}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getObjectTypes"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.metadata.getObjectTypes = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getObjectTypes",
    "endpoint": "/metadata/objects"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getPropertyMetadata"
 *     options : "name"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     name
 */ /*

osapi.jive.corev3.metadata.getPropertyMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getPropertyMetadata",
    "endpoint": "/metadata/properties/{name}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getAllPropertyMetadata"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.metadata.getAllPropertyMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getAllPropertyMetadata",
    "endpoint": "/metadata/properties"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.metadata.getAllTimeZoneMetadata"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.metadata.getAllTimeZoneMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.metadata.getAllTimeZoneMetadata",
    "endpoint": "/metadata/timezones"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.invites.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.invites.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.invites.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/invites/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "invite"
 *     methodName : "osapi.jive.corev3.invites.create"
 */

/**
 * Defines a static updater method
 * @param invite {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.invites.create = function(invite) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.invites.create",
    "optionsInterceptor": "placeIdFromURI",
    "endpoint": "/invites/places/{placeURI}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.members.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.members.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.members.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/members/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "member"
 *     methodName : "osapi.jive.corev3.members.create"
 */

/**
 * Defines a static updater method
 * @param member {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.members.create = function(member) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.members.create",
    "optionsInterceptor": "placeIdFromURI",
    "endpoint": "/members/places/{placeURI}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.blogs.get"
 *     options : "categories, contentTypes, count, description, displayName..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     categories, contentTypes, count, description, displayName, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, name, parent, parentContent, parentPlace, published, resources, sort, startIndex, status, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.blogs.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.blogs.get",
    "endpoint": "/places",
    "overrideParams": {"type": "blog"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.blogs.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.blogs.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.blogs.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/places/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "blog"
 *     methodName : "osapi.jive.corev3.blogs.create"
 */

/**
 * Defines a static updater method
 * @param blog {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.blogs.create = function(blog) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.blogs.create",
    "endpoint": "/places/{uri}/contents",
    "overrideParams": {"type": "blog"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "blog"
 *     methodName : "osapi.jive.corev3.blogs.create"
 */

/**
 * Defines a static updater method
 * @param blog {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.blogs.create = function(blog) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.blogs.create",
    "endpoint": "/places",
    "overrideParams": {"type": "blog"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.carousels.get"
 *     options : "categories, contentTypes, count, description, displayName..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     categories, contentTypes, count, description, displayName, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, name, parent, parentContent, parentPlace, published, resources, sort, startIndex, status, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.carousels.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.carousels.get",
    "endpoint": "/places",
    "overrideParams": {"type": "carousel"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.carousels.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.carousels.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.carousels.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/places/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "carousel"
 *     methodName : "osapi.jive.corev3.carousels.create"
 */

/**
 * Defines a static updater method
 * @param carousel {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.carousels.create = function(carousel) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.carousels.create",
    "endpoint": "/places/{uri}/contents",
    "overrideParams": {"type": "carousel"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "carousel"
 *     methodName : "osapi.jive.corev3.carousels.create"
 */

/**
 * Defines a static updater method
 * @param carousel {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.carousels.create = function(carousel) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.carousels.create",
    "endpoint": "/places",
    "overrideParams": {"type": "carousel"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.groups.get"
 *     options : "contentTypes, count, creator, description, displayName, f..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     contentTypes, count, creator, description, displayName, fields, followerCount, groupType, highlightBody, highlightSubject, highlightTags, id, likeCount, memberCount, name, parent, parentContent, parentPlace, published, resources, sort, startIndex, status, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.groups.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.groups.get",
    "endpoint": "/places",
    "overrideParams": {"type": "group"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.groups.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.groups.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.groups.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/places/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "group"
 *     methodName : "osapi.jive.corev3.groups.create"
 */

/**
 * Defines a static updater method
 * @param group {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.groups.create = function(group) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.groups.create",
    "endpoint": "/places/{uri}/contents",
    "overrideParams": {"type": "group"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "group"
 *     methodName : "osapi.jive.corev3.groups.create"
 */

/**
 * Defines a static updater method
 * @param group {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.groups.create = function(group) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.groups.create",
    "endpoint": "/places",
    "overrideParams": {"type": "group"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.projects.get"
 *     options : "contentTypes, count, creator, description, displayName, d..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     contentTypes, count, creator, description, displayName, dueDate, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, locale, name, parent, parentContent, parentPlace, projectStatus, published, resources, sort, startDate, startIndex, status, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.projects.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.projects.get",
    "endpoint": "/places",
    "overrideParams": {"type": "project"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.projects.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.projects.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.projects.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/places/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "project"
 *     methodName : "osapi.jive.corev3.projects.create"
 */

/**
 * Defines a static updater method
 * @param project {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.projects.create = function(project) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.projects.create",
    "endpoint": "/places/{uri}/contents",
    "overrideParams": {"type": "project"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "project"
 *     methodName : "osapi.jive.corev3.projects.create"
 */

/**
 * Defines a static updater method
 * @param project {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.projects.create = function(project) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.projects.create",
    "endpoint": "/places",
    "overrideParams": {"type": "project"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.spaces.get"
 *     options : "childCount, contentTypes, count, description, displayName..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     childCount, contentTypes, count, description, displayName, fields, followerCount, highlightBody, highlightSubject, highlightTags, id, likeCount, locale, name, parent, parentContent, parentPlace, published, resources, sort, startIndex, status, tags, type, updated, viewCount, visibleToExternalContributors
 */ /*

osapi.jive.corev3.spaces.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.spaces.get",
    "endpoint": "/places",
    "overrideParams": {"type": "space"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.spaces.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.spaces.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.spaces.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/places/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "space"
 *     methodName : "osapi.jive.corev3.spaces.create"
 */

/**
 * Defines a static updater method
 * @param space {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.spaces.create = function(space) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.spaces.create",
    "endpoint": "/places/{uri}/contents",
    "overrideParams": {"type": "space"}
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "space"
 *     methodName : "osapi.jive.corev3.spaces.create"
 */

/**
 * Defines a static updater method
 * @param space {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.spaces.create = function(space) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.spaces.create",
    "endpoint": "/places",
    "overrideParams": {"type": "space"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"startIndex\",\n        \"sor..."
 *     methodName : "osapi.jive.corev3.statics.get"
 *     options : "author, count, description, fields, filename, followerCou..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     author, count, description, fields, filename, followerCount, id, likeCount, place, published, resources, sort, startIndex, tags, type, updated
 */ /*

osapi.jive.corev3.statics.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "startIndex",
        "sort",
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.statics.get",
    "endpoint": "/statics",
    "overrideParams": {"type": "static"}
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.statics.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.statics.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.statics.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/statics/{uri}"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     paramName : "static"
 *     methodName : "osapi.jive.corev3.statics.create"
 */

/**
 * Defines a static updater method
 * @param static {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.statics.create = function(static) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.statics.create",
    "endpoint": "/statics"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"sort\",\n        \"startInde..."
 *     methodName : "osapi.jive.corev3.people.get"
 *     options : "addresses, count, displayName, emails, fields, followerCo..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     addresses, count, displayName, emails, fields, followerCount, followingCount, highlightBody, highlightSubject, highlightTags, id, ids, jive, likeCount, location, name, parentContent, parentPlace, phoneNumbers, photos, published, query, resources, sort, startIndex, status, tags, thumbnailId, thumbnailUrl, type, updated
 */ /*

osapi.jive.corev3.people.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "sort",
        "startIndex",
        "count",
        "query",
        "ids",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.get",
    "endpoint": "/people"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\"\n..."
 *     methodName : "osapi.jive.corev3.people.getRecommendedPeople"
 *     options : "count, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     count, fields
 */ /*

osapi.jive.corev3.people.getRecommendedPeople = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getRecommendedPeople",
    "endpoint": "/people/recommended"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"filter\",..."
 *     methodName : "osapi.jive.corev3.people.getTrendingPeople"
 *     options : "addresses, count, displayName, emails, fields, followerCo..."
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     addresses, count, displayName, emails, fields, followerCount, followingCount, highlightBody, highlightSubject, highlightTags, id, jive, likeCount, location, name, parentContent, parentPlace, phoneNumbers, photos, published, resources, status, tags, thumbnailId, thumbnailUrl, type, updated
 */ /*

osapi.jive.corev3.people.getTrendingPeople = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "count",
        "filter",
        "fields"
    ],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getTrendingPeople",
    "endpoint": "/people/trending"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.people.getMetadata"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.people.getMetadata = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getMetadata",
    "endpoint": "/people/@metadata"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.people.getViewer"
 *     options : "fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields
 */ /*

osapi.jive.corev3.people.getViewer = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getViewer",
    "endpoint": "/people/{uri}",
    "overrideParams": {"uri": "@me"}
});
/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.people.getOwner"
 *     options : "fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields
 */ /*

osapi.jive.corev3.people.getOwner = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getOwner",
    "endpoint": "/people/{uri}",
    "overrideParams": {"uri": "@me"}
});
/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.people.get"
 *     options : "fields, uri"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, uri
 */ /*

osapi.jive.corev3.people.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.get",
    "optionsInterceptor": "parseIdFromURI",
    "endpoint": "/people/{uri}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.people.get"
 *     options : "email, fields"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     email, fields
 */ /*

osapi.jive.corev3.people.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.get",
    "endpoint": "/people/email/{email}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     methodName : "osapi.jive.corev3.people.get"
 *     options : "fields, username"
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     fields, username
 */ /*

osapi.jive.corev3.people.get = function(opts) { [generated code] }

*/ defineStatic({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.get",
    "endpoint": "/people/username/{username}"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.people.getResources"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.people.getResources = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getResources",
    "endpoint": "/people/@resources"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.people.getFilterableFields"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.people.getFilterableFields = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getFilterableFields",
    "endpoint": "/people/@filterableFields"
});

/*
 * Including JS template resource from static-getter.js
 *     staticDef : "{\n    \"httpMethod\": \"GET\",\n    \"name\": \"osapi.jive.corev3..."
 *     methodName : "osapi.jive.corev3.people.getSupportedFields"
 *     options : ""
 */

/**
 * Defines a static getter method which takes a single options argument
 * @param opts {Object} Options object may contain the following properties:
 *     
 */ /*

osapi.jive.corev3.people.getSupportedFields = function(opts) { [generated code] }

*/ defineStatic({
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getSupportedFields",
    "endpoint": "/people/@supportedFields"
});

/*
 * Including JS template resource from static-updater.js
 *     verb : "create"
 *     staticDef : "{\n    \"queryParams\": [\n        \"welcome\",\n        \"fields..."
 *     paramName : "person"
 *     methodName : "osapi.jive.corev3.people.create"
 */

/**
 * Defines a static updater method
 * @param person {$$paramType} the object to create.
 */ /*

osapi.jive.corev3.people.create = function(person) { [generated code] }

*/ defineStatic({
    "queryParams": [
        "welcome",
        "fields"
    ],
    "httpMethod": "POST",
    "name": "osapi.jive.corev3.people.create",
    "endpoint": "/people"
});


/***[ Object Definitions ]***\
*                             *************************************************\
* Object definitions derived from object metadata.                             *
\******************************************************************************/

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"action\""
 *     className : "osapi.jive.corev3.communications.Action"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.communications.Action\""
 *     proto : "{\"type\": \"action\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"actions\",\"ActionEntry[]\",\"actionEn..."
 */

/**
 * define class osapi.jive.corev3.communications.Action, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.communications.Action", osapi.jive.corev3.AbstractObject, {"type": "action"}, []);

/**
 * Describe the fields of osapi.jive.corev3.communications.Action
 * @type {Array}
 */
osapi.jive.corev3.communications.Action.fields = [
defineFieldMetadata("actions","ActionEntry[]","actionEntry",false,false,true),
defineFieldMetadata("body","String"),
defineFieldMetadata("entryState","String"),
defineFieldMetadata("entrySubtype","String"),
defineFieldMetadata("entryType","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("properties","Object"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("requestMessage","String"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("summary","String"),
defineFieldMetadata("target","Object","any"),
defineFieldMetadata("title","String"),
defineFieldMetadata("type","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.communications.Action
 * @type {Object}
 */
typeRegistry["action"] = {
    name: "action",
    ctor: osapi.jive.corev3.communications.Action
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"activity\""
 *     className : "osapi.jive.corev3.activities.Activity"
 *     extraMethods : "[{\n    \"name\": \"toURI\",\n    \"params\": {\"for\": \"ActivityEn..."
 *     classNameString : "\"osapi.jive.corev3.activities.Activity\""
 *     proto : "{\"type\": \"activity\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"actor\",\"ActivityObject\",\"activityO..."
 */

/**
 * define class osapi.jive.corev3.activities.Activity, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.activities.Activity", osapi.jive.corev3.AbstractObject, {"type": "activity"}, [{
    "name": "toURI",
    "params": {"for": "ActivityEntity"}
}]);

/**
 * Describe the fields of osapi.jive.corev3.activities.Activity
 * @type {Array}
 */
osapi.jive.corev3.activities.Activity.fields = [
defineFieldMetadata("actor","ActivityObject","activityObject"),
defineFieldMetadata("content","String",null,true,true),
defineFieldMetadata("generator","ActivityObject","activityObject"),
defineFieldMetadata("icon","MediaLink","mediaLink",true),
defineFieldMetadata("id","String"),
defineFieldMetadata("jive","JiveExtension","jiveExtension",true),
defineFieldMetadata("object","ActivityObject","activityObject",true),
defineFieldMetadata("openSocial","OpenSocial","openSocial",true),
defineFieldMetadata("provider","ActivityObject","activityObject"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("target","ActivityObject","activityObject",true),
defineFieldMetadata("title","String",null,true,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("url","String",null,true),
defineFieldMetadata("verb","String",null,true),
defineFieldMetadata("viewCount","Integer")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.activities.Activity
 * @type {Object}
 */
typeRegistry["activity"] = {
    name: "activity",
    ctor: osapi.jive.corev3.activities.Activity
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"announcement\""
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Announcement\""
 *     proto : "{\"type\": \"announcement\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Announcement, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Announcement", osapi.jive.corev3.AbstractObject, {"type": "announcement"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Announcement
 * @type {Array}
 */
osapi.jive.corev3.contents.Announcement.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("endDate","Date",null,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("image","String",null,true),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("publishDate","Date",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("sortKey","Integer",null,true),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("subjectURI","String",null,true),
defineFieldMetadata("subjectURITargetType","String"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Announcement
 * @type {Object}
 */
typeRegistry["announcement"] = {
    name: "announcement",
    ctor: osapi.jive.corev3.contents.Announcement
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Announcement"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Announcement
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Announcement.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Announcement",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"attachment\""
 *     className : "osapi.jive.corev3.contents.Attachment"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Attachment\""
 *     proto : "{\"type\": \"attachment\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"contentType\",\"String\",null,true,tr..."
 */

/**
 * define class osapi.jive.corev3.contents.Attachment, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Attachment", osapi.jive.corev3.AbstractObject, {"type": "attachment"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Attachment
 * @type {Array}
 */
osapi.jive.corev3.contents.Attachment.fields = [
defineFieldMetadata("contentType","String",null,true,true),
defineFieldMetadata("doUpload","Boolean",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("size","Integer"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("url","String",null,true,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Attachment
 * @type {Object}
 */
typeRegistry["attachment"] = {
    name: "attachment",
    ctor: osapi.jive.corev3.contents.Attachment
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Attachment"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Attachment
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Attachment.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Attachment",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Attachment"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Attachment
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Attachment.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Attachment",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"blog\""
 *     className : "osapi.jive.corev3.places.Blog"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Blog\""
 *     proto : "{\"type\": \"blog\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"categories\",\"Category[]\",\"category..."
 */

/**
 * define class osapi.jive.corev3.places.Blog, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Blog", osapi.jive.corev3.AbstractObject, {"type": "blog"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Blog
 * @type {Array}
 */
osapi.jive.corev3.places.Blog.fields = [
defineFieldMetadata("categories","Category[]","category",false,false,true),
defineFieldMetadata("contentTypes","String[]",null,false,false,true),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("displayName","String",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean",null,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Blog
 * @type {Object}
 */
typeRegistry["blog"] = {
    name: "blog",
    ctor: osapi.jive.corev3.places.Blog
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "createStatic"
 *     resourceName : "statics"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the statics resource.
 * This method will execute a POST for statics resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.createStatic = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "createStatic",
    "signature": "data, params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "getContents"
 *     resourceName : "contents"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the contents resource.
 * This method will execute a GET for contents resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.getContents = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "getContents",
    "signature": "params",
    "resourceName": "contents"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"filter\"..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "getFeaturedContent"
 *     resourceName : "featuredContent"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the featuredContent resource.
 * This method will execute a GET for featuredContent resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.getFeaturedContent = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "filter"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "getFeaturedContent",
    "signature": "params",
    "resourceName": "featuredContent"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "getStatics"
 *     resourceName : "statics"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the statics resource.
 * This method will execute a GET for statics resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.getStatics = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "getStatics",
    "signature": "params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Blog"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Blog
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Blog.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Blog",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"carousel\""
 *     className : "osapi.jive.corev3.places.Carousel"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Carousel\""
 *     proto : "{\"type\": \"carousel\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"categories\",\"Category[]\",\"category..."
 */

/**
 * define class osapi.jive.corev3.places.Carousel, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Carousel", osapi.jive.corev3.AbstractObject, {"type": "carousel"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Carousel
 * @type {Array}
 */
osapi.jive.corev3.places.Carousel.fields = [
defineFieldMetadata("categories","Category[]","category",false,false,true),
defineFieldMetadata("contentTypes","String[]",null,false,false,true),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("displayName","String",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean",null,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Carousel
 * @type {Object}
 */
typeRegistry["carousel"] = {
    name: "carousel",
    ctor: osapi.jive.corev3.places.Carousel
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "createAnnouncement"
 *     resourceName : "announcements"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the announcements resource.
 * This method will execute a POST for announcements resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.createAnnouncement = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {"type": "announcement"},
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "createAnnouncement",
    "signature": "data, params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"uri\"],\n    \"httpMethod\": \"POST\",\n ..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "createAvatar"
 *     resourceName : "avatar"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the avatar resource.
 * This method will execute a POST for avatar resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.createAvatar = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["uri"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "createAvatar",
    "signature": "params",
    "resourceName": "avatar",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"autoCategorize\",\n        ..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "createCategory"
 *     resourceName : "categories"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the categories resource.
 * This method will execute a POST for categories resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.createCategory = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "autoCategorize",
        "fields"
    ],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "createCategory",
    "signature": "data, params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "createStatic"
 *     resourceName : "statics"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the statics resource.
 * This method will execute a POST for statics resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.createStatic = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "createStatic",
    "signature": "data, params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "destroyAvatar"
 *     resourceName : "avatar"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the avatar resource.
 * This method will execute a DELETE for avatar resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.destroyAvatar = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "destroyAvatar",
    "signature": "",
    "resourceName": "avatar"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"activeOnly\",\n        \"cou..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getAnnouncements"
 *     resourceName : "announcements"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the announcements resource.
 * This method will execute a GET for announcements resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getAnnouncements = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "activeOnly",
        "count",
        "expiredQuery",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getAnnouncements",
    "signature": "params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getBlog"
 *     resourceName : "blog"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the blog resource.
 * This method will execute a GET for blog resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getBlog = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getBlog",
    "signature": "params",
    "resourceName": "blog"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getCategories"
 *     resourceName : "categories"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the categories resource.
 * This method will execute a GET for categories resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getCategories = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getCategories",
    "signature": "params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getContents"
 *     resourceName : "contents"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the contents resource.
 * This method will execute a GET for contents resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getContents = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getContents",
    "signature": "params",
    "resourceName": "contents"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"filter\"..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getFeaturedContent"
 *     resourceName : "featuredContent"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the featuredContent resource.
 * This method will execute a GET for featuredContent resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getFeaturedContent = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "filter"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getFeaturedContent",
    "signature": "params",
    "resourceName": "featuredContent"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "getStatics"
 *     resourceName : "statics"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the statics resource.
 * This method will execute a GET for statics resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.getStatics = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "getStatics",
    "signature": "params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Carousel"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Carousel
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Carousel.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Carousel",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"category\""
 *     className : "osapi.jive.corev3.places.Category"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Category\""
 *     proto : "{\"type\": \"category\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"description\",\"String\",null,true),\n..."
 */

/**
 * define class osapi.jive.corev3.places.Category, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Category", osapi.jive.corev3.AbstractObject, {"type": "category"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Category
 * @type {Array}
 */
osapi.jive.corev3.places.Category.fields = [
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("place","String"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Category
 * @type {Object}
 */
typeRegistry["category"] = {
    name: "category",
    ctor: osapi.jive.corev3.places.Category
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Category"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Category
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Category.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Category",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Category"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Category
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Category.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Category",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"autoCategorize\",\n        ..."
 *     className : "osapi.jive.corev3.places.Category"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Category
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Category.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "autoCategorize",
        "fields"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Category",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"checkpoint\""
 *     className : "osapi.jive.corev3.places.CheckPoint"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.places.CheckPoint\""
 *     proto : "{\"type\": \"checkpoint\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"description\",\"String\",null,true),\n..."
 */

/**
 * define class osapi.jive.corev3.places.CheckPoint, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.CheckPoint", osapi.jive.corev3.AbstractObject, {"type": "checkpoint"}, []);

/**
 * Describe the fields of osapi.jive.corev3.places.CheckPoint
 * @type {Array}
 */
osapi.jive.corev3.places.CheckPoint.fields = [
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("dueDate","Date",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("project","Project","project"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.CheckPoint
 * @type {Object}
 */
typeRegistry["checkpoint"] = {
    name: "checkpoint",
    ctor: osapi.jive.corev3.places.CheckPoint
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"comment\""
 *     className : "osapi.jive.corev3.contents.Comment"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Comment\""
 *     proto : "{\"type\": \"comment\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Comment, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Comment", osapi.jive.corev3.AbstractObject, {"type": "comment"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Comment
 * @type {Array}
 */
osapi.jive.corev3.contents.Comment.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("externalID","String"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("rootExternalID","String"),
defineFieldMetadata("rootType","String"),
defineFieldMetadata("rootURI","String"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Comment
 * @type {Object}
 */
typeRegistry["comment"] = {
    name: "comment",
    ctor: osapi.jive.corev3.contents.Comment
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"count\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "count",
        "excludeReplies",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.contents.Comment"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Comment
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Comment.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Comment",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"contentVersion\""
 *     className : "osapi.jive.corev3.contents.ContentVersion"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.ContentVersion\""
 *     proto : "{\"type\": \"contentVersion\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.ContentVersion, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.ContentVersion", osapi.jive.corev3.AbstractObject, {"type": "contentVersion"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.ContentVersion
 * @type {Array}
 */
osapi.jive.corev3.contents.ContentVersion.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","AbstractContent","any"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("minorVersion","Boolean"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String",null,true),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("versionNumber","Integer")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.ContentVersion
 * @type {Object}
 */
typeRegistry["contentVersion"] = {
    name: "contentVersion",
    ctor: osapi.jive.corev3.contents.ContentVersion
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.ContentVersion"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ContentVersion
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.ContentVersion.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ContentVersion",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.ContentVersion"
 *     methodName : "restore"
 *     resourceName : "restore"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ContentVersion
 * to simplify use of the restore resource.
 * This method will execute a POST for restore resources
 */ /*

 osapi.jive.corev3.contents.ContentVersion.prototype.restore = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.ContentVersion",
    "methodName": "restore",
    "signature": "params",
    "resourceName": "restore",
    "hasBody": false
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"discussion\""
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Discussion\""
 *     proto : "{\"type\": \"discussion\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"answer\",\"String\"),\ndefineFieldMeta..."
 */

/**
 * define class osapi.jive.corev3.contents.Discussion, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Discussion", osapi.jive.corev3.AbstractObject, {"type": "discussion"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Discussion
 * @type {Array}
 */
osapi.jive.corev3.contents.Discussion.fields = [
defineFieldMetadata("answer","String"),
defineFieldMetadata("attachments","Attachment[]","attachment",true,false,true),
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("authors","Person[]","person",false,false,true),
defineFieldMetadata("authorship","String"),
defineFieldMetadata("categories","String[]",null,true,false,true),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("helpful","String[]",null,false,false,true),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("onBehalfOf","OnBehalfOf","onBehalfOf",true),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("question","Boolean"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resolved","String",null,true),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("restrictReplies","Boolean"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("users","Person[]","person",true,false,true),
defineFieldMetadata("via","Via","via",true),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibility","String",null,true),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Discussion
 * @type {Object}
 */
typeRegistry["discussion"] = {
    name: "discussion",
    ctor: osapi.jive.corev3.contents.Discussion
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "createReply"
 *     resourceName : "messages"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the messages resource.
 * This method will execute a POST for messages resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.createReply = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "createReply",
    "signature": "data, params",
    "resourceName": "messages"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"count\",..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "getReplies"
 *     resourceName : "messages"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the messages resource.
 * This method will execute a GET for messages resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.getReplies = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "getReplies",
    "signature": "params",
    "resourceName": "messages"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Discussion"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Discussion
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Discussion.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Discussion",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"dm\""
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.communications.DirectMessage\""
 *     proto : "{\"type\": \"dm\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.communications.DirectMessage, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.communications.DirectMessage", osapi.jive.corev3.AbstractObject, {"type": "dm"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.communications.DirectMessage
 * @type {Array}
 */
osapi.jive.corev3.communications.DirectMessage.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("parent","String"),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("participants","Person[]","person",false,false,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.communications.DirectMessage
 * @type {Object}
 */
typeRegistry["dm"] = {
    name: "dm",
    ctor: osapi.jive.corev3.communications.DirectMessage
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "createReply"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.createReply = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "createReply",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "getContentImages"
 *     resourceName : "images"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the images resource.
 * This method will execute a GET for images resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.getContentImages = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "getContentImages",
    "signature": "params",
    "resourceName": "images"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"count\",..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "getReplies"
 *     resourceName : "messages"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the messages resource.
 * This method will execute a GET for messages resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.getReplies = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "getReplies",
    "signature": "params",
    "resourceName": "messages"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.DirectMessage"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.DirectMessage
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.communications.DirectMessage.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.DirectMessage",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"document\""
 *     className : "osapi.jive.corev3.contents.Document"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Document\""
 *     proto : "{\"type\": \"document\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"approvers\",\"Person[]\",\"person\",tru..."
 */

/**
 * define class osapi.jive.corev3.contents.Document, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Document", osapi.jive.corev3.AbstractObject, {"type": "document"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Document
 * @type {Array}
 */
osapi.jive.corev3.contents.Document.fields = [
defineFieldMetadata("approvers","Person[]","person",true,false,true),
defineFieldMetadata("attachments","Attachment[]","attachment",true,false,true),
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("authors","Person[]","person",true,false,true),
defineFieldMetadata("authorship","String",null,true),
defineFieldMetadata("categories","String[]",null,true,false,true),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("editingBy","Person","person"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("fromQuest","String",null,true),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("restrictComments","Boolean",null,true),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("updater","Person","person"),
defineFieldMetadata("users","Person[]","person",true,false,true),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibility","String",null,true),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Document
 * @type {Object}
 */
typeRegistry["document"] = {
    name: "document",
    ctor: osapi.jive.corev3.contents.Document
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getAttachments"
 *     resourceName : "attachments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the attachments resource.
 * This method will execute a GET for attachments resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getAttachments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getAttachments",
    "signature": "params",
    "resourceName": "attachments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "getVersions"
 *     resourceName : "versions"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the versions resource.
 * This method will execute a GET for versions resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.getVersions = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "getVersions",
    "signature": "params",
    "resourceName": "versions"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Document"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Document
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Document.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Document",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"extStreamActivity\""
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.ExternalStreamActivity\""
 *     proto : "{\"type\": \"extStreamActivity\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"action\",\"JSONObject\",null,false,tr..."
 */

/**
 * define class osapi.jive.corev3.contents.ExternalStreamActivity, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.ExternalStreamActivity", osapi.jive.corev3.AbstractObject, {"type": "extStreamActivity"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.ExternalStreamActivity
 * @type {Array}
 */
osapi.jive.corev3.contents.ExternalStreamActivity.fields = [
defineFieldMetadata("action","JSONObject",null,false,true),
defineFieldMetadata("actor","JSONObject"),
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("externalID","String"),
defineFieldMetadata("externalStreamID","Integer"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("object","JSONObject"),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("properties","JSONObject"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.ExternalStreamActivity
 * @type {Object}
 */
typeRegistry["extStreamActivity"] = {
    name: "extStreamActivity",
    ctor: osapi.jive.corev3.contents.ExternalStreamActivity
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getContentImages"
 *     resourceName : "images"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the images resource.
 * This method will execute a GET for images resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getContentImages = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getContentImages",
    "signature": "params",
    "resourceName": "images"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.ExternalStreamActivity"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalStreamActivity
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.ExternalStreamActivity.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.ExternalStreamActivity",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"extprop\""
 *     className : "osapi.jive.corev3.extprops.ExtProps"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.extprops.ExtProps\""
 *     proto : "{\"type\": \"extprop\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"id\",\"String\"),\ndefineFieldMetadata..."
 */

/**
 * define class osapi.jive.corev3.extprops.ExtProps, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.extprops.ExtProps", osapi.jive.corev3.AbstractObject, {"type": "extprop"}, []);

/**
 * Describe the fields of osapi.jive.corev3.extprops.ExtProps
 * @type {Array}
 */
osapi.jive.corev3.extprops.ExtProps.fields = [
defineFieldMetadata("id","String"),
defineFieldMetadata("parent","String"),
defineFieldMetadata("props","Object"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("type","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.extprops.ExtProps
 * @type {Object}
 */
typeRegistry["extprop"] = {
    name: "extprop",
    ctor: osapi.jive.corev3.extprops.ExtProps
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"favorite\""
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Favorite\""
 *     proto : "{\"type\": \"favorite\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Favorite, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Favorite", osapi.jive.corev3.AbstractObject, {"type": "favorite"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Favorite
 * @type {Array}
 */
osapi.jive.corev3.contents.Favorite.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("favoriteObject","Object","any",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("parent","String"),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("private","Boolean",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Favorite
 * @type {Object}
 */
typeRegistry["favorite"] = {
    name: "favorite",
    ctor: osapi.jive.corev3.contents.Favorite
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Favorite"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Favorite
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Favorite.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Favorite",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"field\""
 *     className : "osapi.jive.corev3.metadata.Field"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.metadata.Field\""
 *     proto : "{\"type\": \"field\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"array\",\"Boolean\"),\ndefineFieldMeta..."
 */

/**
 * define class osapi.jive.corev3.metadata.Field, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.metadata.Field", osapi.jive.corev3.AbstractObject, {"type": "field"}, []);

/**
 * Describe the fields of osapi.jive.corev3.metadata.Field
 * @type {Array}
 */
osapi.jive.corev3.metadata.Field.fields = [
defineFieldMetadata("array","Boolean"),
defineFieldMetadata("availability","String"),
defineFieldMetadata("description","String"),
defineFieldMetadata("displayName","String"),
defineFieldMetadata("editable","Boolean"),
defineFieldMetadata("entityType","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("name","String"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("required","Boolean"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("since","String"),
defineFieldMetadata("type","String"),
defineFieldMetadata("unpublished","Boolean"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.metadata.Field
 * @type {Object}
 */
typeRegistry["field"] = {
    name: "field",
    ctor: osapi.jive.corev3.metadata.Field
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"file\""
 *     className : "osapi.jive.corev3.contents.File"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.File\""
 *     proto : "{\"type\": \"file\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.File, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.File", osapi.jive.corev3.AbstractObject, {"type": "file"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.File
 * @type {Array}
 */
osapi.jive.corev3.contents.File.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("authors","Person[]","person",true,false,true),
defineFieldMetadata("authorship","String",null,true),
defineFieldMetadata("binaryURL","String"),
defineFieldMetadata("categories","String[]",null,true,false,true),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("contentType","String"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String"),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("restrictComments","Boolean",null,true),
defineFieldMetadata("size","Integer"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("users","Person[]","person",true,false,true),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibility","String",null,true),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.File
 * @type {Object}
 */
typeRegistry["file"] = {
    name: "file",
    ctor: osapi.jive.corev3.contents.File
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "getVersions"
 *     resourceName : "versions"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the versions resource.
 * This method will execute a GET for versions resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.getVersions = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "getVersions",
    "signature": "params",
    "resourceName": "versions"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.File"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.File
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.File.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.File",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"group\""
 *     className : "osapi.jive.corev3.places.Group"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Group\""
 *     proto : "{\"type\": \"group\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"contentTypes\",\"String[]\",null,true..."
 */

/**
 * define class osapi.jive.corev3.places.Group, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Group", osapi.jive.corev3.AbstractObject, {"type": "group"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Group
 * @type {Array}
 */
osapi.jive.corev3.places.Group.fields = [
defineFieldMetadata("contentTypes","String[]",null,true,false,true),
defineFieldMetadata("creator","Person","person"),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("displayName","String",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("groupType","String",null,true,true),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("memberCount","Integer"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("parent","String"),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean",null,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Group
 * @type {Object}
 */
typeRegistry["group"] = {
    name: "group",
    ctor: osapi.jive.corev3.places.Group
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createAnnouncement"
 *     resourceName : "announcements"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the announcements resource.
 * This method will execute a POST for announcements resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createAnnouncement = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {"type": "announcement"},
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createAnnouncement",
    "signature": "data, params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"uri\"],\n    \"httpMethod\": \"POST\",\n ..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createAvatar"
 *     resourceName : "avatar"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the avatar resource.
 * This method will execute a POST for avatar resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createAvatar = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["uri"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createAvatar",
    "signature": "params",
    "resourceName": "avatar",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"autoCategorize\",\n        ..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createCategory"
 *     resourceName : "categories"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the categories resource.
 * This method will execute a POST for categories resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createCategory = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "autoCategorize",
        "fields"
    ],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createCategory",
    "signature": "data, params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createInvites"
 *     resourceName : "invites"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the invites resource.
 * This method will execute a POST for invites resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createInvites = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createInvites",
    "signature": "data, params",
    "resourceName": "invites"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createMember"
 *     resourceName : "members"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the members resource.
 * This method will execute a POST for members resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createMember = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createMember",
    "signature": "data, params",
    "resourceName": "members"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "createStatic"
 *     resourceName : "statics"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the statics resource.
 * This method will execute a POST for statics resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.createStatic = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "createStatic",
    "signature": "data, params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "destroyAvatar"
 *     resourceName : "avatar"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the avatar resource.
 * This method will execute a DELETE for avatar resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.destroyAvatar = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "destroyAvatar",
    "signature": "",
    "resourceName": "avatar"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"activeOnly\",\n        \"cou..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getAnnouncements"
 *     resourceName : "announcements"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the announcements resource.
 * This method will execute a GET for announcements resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getAnnouncements = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "activeOnly",
        "count",
        "expiredQuery",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getAnnouncements",
    "signature": "params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getBlog"
 *     resourceName : "blog"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the blog resource.
 * This method will execute a GET for blog resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getBlog = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getBlog",
    "signature": "params",
    "resourceName": "blog"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getCategories"
 *     resourceName : "categories"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the categories resource.
 * This method will execute a GET for categories resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getCategories = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getCategories",
    "signature": "params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getContents"
 *     resourceName : "contents"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the contents resource.
 * This method will execute a GET for contents resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getContents = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getContents",
    "signature": "params",
    "resourceName": "contents"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"filter\"..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getFeaturedContent"
 *     resourceName : "featuredContent"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the featuredContent resource.
 * This method will execute a GET for featuredContent resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getFeaturedContent = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "filter"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getFeaturedContent",
    "signature": "params",
    "resourceName": "featuredContent"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getInvites"
 *     resourceName : "invites"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the invites resource.
 * This method will execute a GET for invites resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getInvites = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "invitee",
        "inviter",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getInvites",
    "signature": "params",
    "resourceName": "invites"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getMembers"
 *     resourceName : "members"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the members resource.
 * This method will execute a GET for members resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getMembers = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex",
        "state"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getMembers",
    "signature": "params",
    "resourceName": "members"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getPlaces"
 *     resourceName : "places"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the places resource.
 * This method will execute a GET for places resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getPlaces = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getPlaces",
    "signature": "params",
    "resourceName": "places"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "getStatics"
 *     resourceName : "statics"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the statics resource.
 * This method will execute a GET for statics resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.getStatics = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "getStatics",
    "signature": "params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Group"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Group
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Group.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Group",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"image\""
 *     className : "osapi.jive.corev3.contents.Image"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.contents.Image\""
 *     proto : "{\"type\": \"image\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"contentType\",\"String\"),\ndefineFiel..."
 */

/**
 * define class osapi.jive.corev3.contents.Image, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Image", osapi.jive.corev3.AbstractObject, {"type": "image"}, []);

/**
 * Describe the fields of osapi.jive.corev3.contents.Image
 * @type {Array}
 */
osapi.jive.corev3.contents.Image.fields = [
defineFieldMetadata("contentType","String"),
defineFieldMetadata("description","String"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("name","String"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("size","Integer"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Image
 * @type {Object}
 */
typeRegistry["image"] = {
    name: "image",
    ctor: osapi.jive.corev3.contents.Image
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"inboxEntry\""
 *     className : "osapi.jive.corev3.inbox.InboxEntry"
 *     extraMethods : "[{\n    \"name\": \"toURI\",\n    \"params\": {\"for\": \"ActivityEn..."
 *     classNameString : "\"osapi.jive.corev3.inbox.InboxEntry\""
 *     proto : "{\"type\": \"inboxEntry\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"actor\",\"ActivityObject\",\"activityO..."
 */

/**
 * define class osapi.jive.corev3.inbox.InboxEntry, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.inbox.InboxEntry", osapi.jive.corev3.AbstractObject, {"type": "inboxEntry"}, [{
    "name": "toURI",
    "params": {"for": "ActivityEntity"}
}]);

/**
 * Describe the fields of osapi.jive.corev3.inbox.InboxEntry
 * @type {Array}
 */
osapi.jive.corev3.inbox.InboxEntry.fields = [
defineFieldMetadata("actor","ActivityObject","activityObject"),
defineFieldMetadata("content","String",null,true,true),
defineFieldMetadata("generator","ActivityObject","activityObject"),
defineFieldMetadata("icon","MediaLink","mediaLink",true),
defineFieldMetadata("id","String"),
defineFieldMetadata("jive","JiveExtension","jiveExtension",true),
defineFieldMetadata("object","ActivityObject","activityObject",true),
defineFieldMetadata("openSocial","OpenSocial","openSocial",true),
defineFieldMetadata("provider","ActivityObject","activityObject"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("target","ActivityObject","activityObject",true),
defineFieldMetadata("title","String",null,true,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("url","String",null,true),
defineFieldMetadata("verb","String",null,true),
defineFieldMetadata("viewCount","Integer")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.inbox.InboxEntry
 * @type {Object}
 */
typeRegistry["inboxEntry"] = {
    name: "inboxEntry",
    ctor: osapi.jive.corev3.inbox.InboxEntry
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"invite\""
 *     className : "osapi.jive.corev3.places.Invite"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Invite\""
 *     proto : "{\"type\": \"invite\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"body\",\"String\"),\ndefineFieldMetada..."
 */

/**
 * define class osapi.jive.corev3.places.Invite, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Invite", osapi.jive.corev3.AbstractObject, {"type": "invite"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Invite
 * @type {Array}
 */
osapi.jive.corev3.places.Invite.fields = [
defineFieldMetadata("body","String"),
defineFieldMetadata("email","String"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("invitee","Person","person"),
defineFieldMetadata("inviter","Person","person"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("place","Place","any"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("revokeDate","Date"),
defineFieldMetadata("revoker","Person","person"),
defineFieldMetadata("sentDate","Date"),
defineFieldMetadata("state","String"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Invite
 * @type {Object}
 */
typeRegistry["invite"] = {
    name: "invite",
    ctor: osapi.jive.corev3.places.Invite
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Invite"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Invite
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Invite.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Invite",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Invite"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Invite
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Invite.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Invite",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Invite"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Invite
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Invite.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Invite",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"jiveProperty\""
 *     className : "osapi.jive.corev3.admin.JiveProperty"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.admin.JiveProperty\""
 *     proto : "{\"type\": \"jiveProperty\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"id\",\"String\"),\ndefineFieldMetadata..."
 */

/**
 * define class osapi.jive.corev3.admin.JiveProperty, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.admin.JiveProperty", osapi.jive.corev3.AbstractObject, {"type": "jiveProperty"}, []);

/**
 * Describe the fields of osapi.jive.corev3.admin.JiveProperty
 * @type {Array}
 */
osapi.jive.corev3.admin.JiveProperty.fields = [
defineFieldMetadata("id","String"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("type","String"),
defineFieldMetadata("value","String",null,true,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.admin.JiveProperty
 * @type {Object}
 */
typeRegistry["jiveProperty"] = {
    name: "jiveProperty",
    ctor: osapi.jive.corev3.admin.JiveProperty
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"locale\""
 *     className : "osapi.jive.corev3.metadata.Locale"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.metadata.Locale\""
 *     proto : "{\"type\": \"locale\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"country\",\"String\"),\ndefineFieldMet..."
 */

/**
 * define class osapi.jive.corev3.metadata.Locale, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.metadata.Locale", osapi.jive.corev3.AbstractObject, {"type": "locale"}, []);

/**
 * Describe the fields of osapi.jive.corev3.metadata.Locale
 * @type {Array}
 */
osapi.jive.corev3.metadata.Locale.fields = [
defineFieldMetadata("country","String"),
defineFieldMetadata("displayCountry","String"),
defineFieldMetadata("displayLanguage","String"),
defineFieldMetadata("displayVariant","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("language","String"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("variant","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.metadata.Locale
 * @type {Object}
 */
typeRegistry["locale"] = {
    name: "locale",
    ctor: osapi.jive.corev3.metadata.Locale
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"member\""
 *     className : "osapi.jive.corev3.places.Member"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Member\""
 *     proto : "{\"type\": \"member\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"followerCount\",\"Integer\"),\ndefineF..."
 */

/**
 * define class osapi.jive.corev3.places.Member, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Member", osapi.jive.corev3.AbstractObject, {"type": "member"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Member
 * @type {Array}
 */
osapi.jive.corev3.places.Member.fields = [
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("group","Group","group"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("person","Person","person"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("state","String",null,true,true),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Member
 * @type {Object}
 */
typeRegistry["member"] = {
    name: "member",
    ctor: osapi.jive.corev3.places.Member
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Member"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Member
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Member.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Member",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Member"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Member
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Member.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Member",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Member"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Member
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Member.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Member",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"mention\""
 *     className : "osapi.jive.corev3.communications.Mention"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.communications.Mention\""
 *     proto : "{\"type\": \"mention\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"followerCount\",\"Integer\"),\ndefineF..."
 */

/**
 * define class osapi.jive.corev3.communications.Mention, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.communications.Mention", osapi.jive.corev3.AbstractObject, {"type": "mention"}, []);

/**
 * Describe the fields of osapi.jive.corev3.communications.Mention
 * @type {Array}
 */
osapi.jive.corev3.communications.Mention.fields = [
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("mentionedContent","Content","any"),
defineFieldMetadata("mentionedObject","Object","any"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.communications.Mention
 * @type {Object}
 */
typeRegistry["mention"] = {
    name: "mention",
    ctor: osapi.jive.corev3.communications.Mention
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.communications.Mention"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Mention
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.communications.Mention.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Mention",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.communications.Mention"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Mention
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.communications.Mention.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.Mention",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.Mention"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Mention
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.communications.Mention.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.Mention",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"message\""
 *     className : "osapi.jive.corev3.contents.Message"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Message\""
 *     proto : "{\"type\": \"message\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"answer\",\"Boolean\",null,true),\ndefi..."
 */

/**
 * define class osapi.jive.corev3.contents.Message, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Message", osapi.jive.corev3.AbstractObject, {"type": "message"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Message
 * @type {Array}
 */
osapi.jive.corev3.contents.Message.fields = [
defineFieldMetadata("answer","Boolean",null,true),
defineFieldMetadata("attachments","Attachment[]","attachment",true,false,true),
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("discussion","String"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("fromQuest","String",null,true),
defineFieldMetadata("helpful","Boolean",null,true),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("onBehalfOf","OnBehalfOf","onBehalfOf",true),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("via","Via","via",true),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Message
 * @type {Object}
 */
typeRegistry["message"] = {
    name: "message",
    ctor: osapi.jive.corev3.contents.Message
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "createReply"
 *     resourceName : "messages"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the messages resource.
 * This method will execute a POST for messages resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.createReply = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "createReply",
    "signature": "data, params",
    "resourceName": "messages"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getAttachments"
 *     resourceName : "attachments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the attachments resource.
 * This method will execute a GET for attachments resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getAttachments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getAttachments",
    "signature": "params",
    "resourceName": "attachments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"count\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "getReplies"
 *     resourceName : "messages"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the messages resource.
 * This method will execute a GET for messages resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.getReplies = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "getReplies",
    "signature": "params",
    "resourceName": "messages"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.contents.Message"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Message
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Message.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Message",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"object\""
 *     className : "osapi.jive.corev3.metadata.Object"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.metadata.Object\""
 *     proto : "{\"type\": \"object\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"associatable\",\"Boolean\"),\ndefineFi..."
 */

/**
 * define class osapi.jive.corev3.metadata.Object, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.metadata.Object", osapi.jive.corev3.AbstractObject, {"type": "object"}, []);

/**
 * Describe the fields of osapi.jive.corev3.metadata.Object
 * @type {Array}
 */
osapi.jive.corev3.metadata.Object.fields = [
defineFieldMetadata("associatable","Boolean"),
defineFieldMetadata("availability","String"),
defineFieldMetadata("commentable","Boolean"),
defineFieldMetadata("content","Boolean"),
defineFieldMetadata("description","String"),
defineFieldMetadata("example","String"),
defineFieldMetadata("fields","Field[]","field",false,false,true),
defineFieldMetadata("id","String"),
defineFieldMetadata("name","String"),
defineFieldMetadata("objectType","Integer"),
defineFieldMetadata("outcomeTypes","OutcomeType[]","outcomeType",false,false,true),
defineFieldMetadata("place","Boolean"),
defineFieldMetadata("plural","String"),
defineFieldMetadata("resourceLinks","Resource[]","resource",false,false,true),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("since","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.metadata.Object
 * @type {Object}
 */
typeRegistry["object"] = {
    name: "object",
    ctor: osapi.jive.corev3.metadata.Object
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"outcome\""
 *     className : "osapi.jive.corev3.contents.Outcome"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Outcome\""
 *     proto : "{\"type\": \"outcome\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"creationDate\",\"Date\"),\ndefineField..."
 */

/**
 * define class osapi.jive.corev3.contents.Outcome, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Outcome", osapi.jive.corev3.AbstractObject, {"type": "outcome"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Outcome
 * @type {Array}
 */
osapi.jive.corev3.contents.Outcome.fields = [
defineFieldMetadata("creationDate","Date"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("note","String"),
defineFieldMetadata("outcomeType","OutcomeType","outcomeType",false,true),
defineFieldMetadata("parent","String"),
defineFieldMetadata("predecessorOutcome","String"),
defineFieldMetadata("properties","Object",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("successorOutcomeTypes","OutcomeType[]","outcomeType",false,false,true),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("user","Person","person")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Outcome
 * @type {Object}
 */
typeRegistry["outcome"] = {
    name: "outcome",
    ctor: osapi.jive.corev3.contents.Outcome
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Outcome"
 *     methodName : "createOutcome"
 *     resourceName : "outcome"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Outcome
 * to simplify use of the outcome resource.
 * This method will execute a POST for outcome resources
 */ /*

 osapi.jive.corev3.contents.Outcome.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Outcome",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcome"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Outcome"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Outcome
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Outcome.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Outcome",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Outcome"
 *     methodName : "getHistory"
 *     resourceName : "history"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Outcome
 * to simplify use of the history resource.
 * This method will execute a GET for history resources
 */ /*

 osapi.jive.corev3.contents.Outcome.prototype.getHistory = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Outcome",
    "methodName": "getHistory",
    "signature": "params",
    "resourceName": "history"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.contents.Outcome"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Outcome
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Outcome.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Outcome",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"outcomeType\""
 *     className : "osapi.jive.corev3.contents.OutcomeType"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.contents.OutcomeType\""
 *     proto : "{\"type\": \"outcomeType\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"fields\",\"Field[]\",\"field\",false,fa..."
 */

/**
 * define class osapi.jive.corev3.contents.OutcomeType, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.OutcomeType", osapi.jive.corev3.AbstractObject, {"type": "outcomeType"}, []);

/**
 * Describe the fields of osapi.jive.corev3.contents.OutcomeType
 * @type {Array}
 */
osapi.jive.corev3.contents.OutcomeType.fields = [
defineFieldMetadata("fields","Field[]","field",false,false,true),
defineFieldMetadata("id","String"),
defineFieldMetadata("name","String"),
defineFieldMetadata("resources","Object")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.OutcomeType
 * @type {Object}
 */
typeRegistry["outcomeType"] = {
    name: "outcomeType",
    ctor: osapi.jive.corev3.contents.OutcomeType
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"person\""
 *     className : "osapi.jive.corev3.people.Person"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.people.Person\""
 *     proto : "{\"type\": \"person\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"addresses\",\"Addresses[]\",\"addresse..."
 */

/**
 * define class osapi.jive.corev3.people.Person, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.people.Person", osapi.jive.corev3.AbstractObject, {"type": "person"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.people.Person
 * @type {Array}
 */
osapi.jive.corev3.people.Person.fields = [
defineFieldMetadata("addresses","Addresses[]","addresses",true,false,true),
defineFieldMetadata("displayName","String"),
defineFieldMetadata("emails","Emails[]","emails",true,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("followingCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("jive","Jive","jive",true,true),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("location","String",null,true),
defineFieldMetadata("name","Name","name",true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("phoneNumbers","PhoneNumbers[]","phoneNumbers",true,false,true),
defineFieldMetadata("photos","Photos[]","photos",false,false,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String",null,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("thumbnailId","String"),
defineFieldMetadata("thumbnailUrl","String"),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.people.Person
 * @type {Object}
 */
typeRegistry["person"] = {
    name: "person",
    ctor: osapi.jive.corev3.people.Person
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "createStream"
 *     resourceName : "streams"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the streams resource.
 * This method will execute a POST for streams resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.createStream = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "createStream",
    "signature": "data, params",
    "resourceName": "streams"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "createTask"
 *     resourceName : "tasks"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the tasks resource.
 * This method will execute a POST for tasks resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.createTask = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "createTask",
    "signature": "data, params",
    "resourceName": "tasks"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getBlog"
 *     resourceName : "blog"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the blog resource.
 * This method will execute a GET for blog resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getBlog = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getBlog",
    "signature": "params",
    "resourceName": "blog"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getColleagues"
 *     resourceName : "colleagues"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the colleagues resource.
 * This method will execute a GET for colleagues resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getColleagues = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getColleagues",
    "signature": "params",
    "resourceName": "colleagues"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getFollowers"
 *     resourceName : "followers"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the followers resource.
 * This method will execute a GET for followers resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getFollowers = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getFollowers",
    "signature": "params",
    "resourceName": "followers"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getFollowing"
 *     resourceName : "following"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the following resource.
 * This method will execute a GET for following resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getFollowing = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getFollowing",
    "signature": "params",
    "resourceName": "following"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getImages"
 *     resourceName : "images"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the images resource.
 * This method will execute a GET for images resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getImages = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getImages",
    "signature": "params",
    "resourceName": "images"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getManager"
 *     resourceName : "manager"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the manager resource.
 * This method will execute a GET for manager resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getManager = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getManager",
    "signature": "params",
    "resourceName": "manager"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getMembers"
 *     resourceName : "members"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the members resource.
 * This method will execute a GET for members resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getMembers = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex",
        "state"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getMembers",
    "signature": "params",
    "resourceName": "members"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getReports"
 *     resourceName : "reports"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the reports resource.
 * This method will execute a GET for reports resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getReports = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getReports",
    "signature": "params",
    "resourceName": "reports"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getStreams"
 *     resourceName : "streams"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the streams resource.
 * This method will execute a GET for streams resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getStreams = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getStreams",
    "signature": "params",
    "resourceName": "streams"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "getTasks"
 *     resourceName : "tasks"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the tasks resource.
 * This method will execute a GET for tasks resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.getTasks = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "getTasks",
    "signature": "params",
    "resourceName": "tasks"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"PUT\",\n    \"cl..."
 *     className : "osapi.jive.corev3.people.Person"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.Person
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.people.Person.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.people.Person",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"plugin\""
 *     className : "osapi.jive.corev3.admin.Plugin"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.admin.Plugin\""
 *     proto : "{\"type\": \"plugin\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"String\"),\ndefineFieldMeta..."
 */

/**
 * define class osapi.jive.corev3.admin.Plugin, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.admin.Plugin", osapi.jive.corev3.AbstractObject, {"type": "plugin"}, []);

/**
 * Describe the fields of osapi.jive.corev3.admin.Plugin
 * @type {Array}
 */
osapi.jive.corev3.admin.Plugin.fields = [
defineFieldMetadata("author","String"),
defineFieldMetadata("broken","Boolean"),
defineFieldMetadata("databaseKey","String"),
defineFieldMetadata("dependency","String"),
defineFieldMetadata("description","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("installed","Boolean"),
defineFieldMetadata("minServerVersion","String"),
defineFieldMetadata("name","String"),
defineFieldMetadata("properties","Object"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("type","String"),
defineFieldMetadata("uninstalled","Boolean"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("version","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.admin.Plugin
 * @type {Object}
 */
typeRegistry["plugin"] = {
    name: "plugin",
    ctor: osapi.jive.corev3.admin.Plugin
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"poll\""
 *     className : "osapi.jive.corev3.contents.Poll"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Poll\""
 *     proto : "{\"type\": \"poll\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Poll, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Poll", osapi.jive.corev3.AbstractObject, {"type": "poll"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Poll
 * @type {Array}
 */
osapi.jive.corev3.contents.Poll.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("authors","Person[]","person",false,false,true),
defineFieldMetadata("authorship","String"),
defineFieldMetadata("categories","String[]",null,true,false,true),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("options","String[]",null,true,true,true),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("users","Person[]","person",true,false,true),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibility","String",null,true),
defineFieldMetadata("visibleToExternalContributors","Boolean"),
defineFieldMetadata("voteCount","Integer"),
defineFieldMetadata("votes","String[]",null,false,false,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Poll
 * @type {Object}
 */
typeRegistry["poll"] = {
    name: "poll",
    ctor: osapi.jive.corev3.contents.Poll
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"httpMethod\": \"GET\",\n    \"className\": \"osapi.jive.c..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "getVotes"
 *     resourceName : "votes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the votes resource.
 * This method will execute a GET for votes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.getVotes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "getVotes",
    "signature": "params",
    "resourceName": "votes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"httpMethod\": \"POST\",\n    \"className\": \"osapi.jive...."
 *     className : "osapi.jive.corev3.contents.Poll"
 *     methodName : "vote"
 *     resourceName : "votes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Poll
 * to simplify use of the votes resource.
 * This method will execute a POST for votes resources
 */ /*

 osapi.jive.corev3.contents.Poll.prototype.vote = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Poll",
    "methodName": "vote",
    "signature": "data, params",
    "resourceName": "votes"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"post\""
 *     className : "osapi.jive.corev3.contents.Post"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Post\""
 *     proto : "{\"type\": \"post\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"attachments\",\"Attachment[]\",\"attac..."
 */

/**
 * define class osapi.jive.corev3.contents.Post, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Post", osapi.jive.corev3.AbstractObject, {"type": "post"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Post
 * @type {Array}
 */
osapi.jive.corev3.contents.Post.fields = [
defineFieldMetadata("attachments","Attachment[]","attachment",true,false,true),
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("categories","String[]",null,true,false,true),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("outcomeTypeNames","Object"),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("permalink","String"),
defineFieldMetadata("publishDate","Date",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("restrictComments","Boolean",null,true),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Post
 * @type {Object}
 */
typeRegistry["post"] = {
    name: "post",
    ctor: osapi.jive.corev3.contents.Post
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getAttachments"
 *     resourceName : "attachments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the attachments resource.
 * This method will execute a GET for attachments resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getAttachments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getAttachments",
    "signature": "params",
    "resourceName": "attachments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Post"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Post
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Post.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Post",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"profileImage\""
 *     className : "osapi.jive.corev3.people.ProfileImage"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.people.ProfileImage\""
 *     proto : "{\"type\": \"profileImage\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"followerCount\",\"Integer\"),\ndefineF..."
 */

/**
 * define class osapi.jive.corev3.people.ProfileImage, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.people.ProfileImage", osapi.jive.corev3.AbstractObject, {"type": "profileImage"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.people.ProfileImage
 * @type {Array}
 */
osapi.jive.corev3.people.ProfileImage.fields = [
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("ref","URI"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.people.ProfileImage
 * @type {Object}
 */
typeRegistry["profileImage"] = {
    name: "profileImage",
    ctor: osapi.jive.corev3.people.ProfileImage
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.people.ProfileImage"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.ProfileImage
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.people.ProfileImage.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.people.ProfileImage",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.people.ProfileImage"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.ProfileImage
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.people.ProfileImage.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.people.ProfileImage",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"httpMethod\": \"PUT\",\n    \"className\": \"osapi.jive.c..."
 *     className : "osapi.jive.corev3.people.ProfileImage"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.people.ProfileImage
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.people.ProfileImage.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.people.ProfileImage",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"project\""
 *     className : "osapi.jive.corev3.places.Project"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Project\""
 *     proto : "{\"type\": \"project\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"contentTypes\",\"String[]\",null,true..."
 */

/**
 * define class osapi.jive.corev3.places.Project, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Project", osapi.jive.corev3.AbstractObject, {"type": "project"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Project
 * @type {Array}
 */
osapi.jive.corev3.places.Project.fields = [
defineFieldMetadata("contentTypes","String[]",null,true,false,true),
defineFieldMetadata("creator","Person","person"),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("displayName","String",null,true,true),
defineFieldMetadata("dueDate","Date",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("locale","String"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("projectStatus","String"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("startDate","Date",null,true,true),
defineFieldMetadata("status","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean",null,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Project
 * @type {Object}
 */
typeRegistry["project"] = {
    name: "project",
    ctor: osapi.jive.corev3.places.Project
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "createAnnouncement"
 *     resourceName : "announcements"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the announcements resource.
 * This method will execute a POST for announcements resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.createAnnouncement = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {"type": "announcement"},
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "createAnnouncement",
    "signature": "data, params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"uri\"],\n    \"httpMethod\": \"POST\",\n ..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "createAvatar"
 *     resourceName : "avatar"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the avatar resource.
 * This method will execute a POST for avatar resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.createAvatar = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["uri"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "createAvatar",
    "signature": "params",
    "resourceName": "avatar",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"autoCategorize\",\n        ..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "createCategory"
 *     resourceName : "categories"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the categories resource.
 * This method will execute a POST for categories resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.createCategory = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "autoCategorize",
        "fields"
    ],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "createCategory",
    "signature": "data, params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "createStatic"
 *     resourceName : "statics"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the statics resource.
 * This method will execute a POST for statics resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.createStatic = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "createStatic",
    "signature": "data, params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "createTask"
 *     resourceName : "tasks"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the tasks resource.
 * This method will execute a POST for tasks resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.createTask = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "createTask",
    "signature": "data, params",
    "resourceName": "tasks"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "destroyAvatar"
 *     resourceName : "avatar"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the avatar resource.
 * This method will execute a DELETE for avatar resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.destroyAvatar = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "destroyAvatar",
    "signature": "",
    "resourceName": "avatar"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"activeOnly\",\n        \"cou..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getAnnouncements"
 *     resourceName : "announcements"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the announcements resource.
 * This method will execute a GET for announcements resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getAnnouncements = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "activeOnly",
        "count",
        "expiredQuery",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getAnnouncements",
    "signature": "params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getBlog"
 *     resourceName : "blog"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the blog resource.
 * This method will execute a GET for blog resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getBlog = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getBlog",
    "signature": "params",
    "resourceName": "blog"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getCategories"
 *     resourceName : "categories"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the categories resource.
 * This method will execute a GET for categories resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getCategories = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getCategories",
    "signature": "params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getCheckpoints"
 *     resourceName : "getCheckpoints"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the getCheckpoints resource.
 * This method will execute a GET for getCheckpoints resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getCheckpoints = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getCheckpoints",
    "signature": "params",
    "resourceName": "getCheckpoints"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getContents"
 *     resourceName : "contents"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the contents resource.
 * This method will execute a GET for contents resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getContents = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getContents",
    "signature": "params",
    "resourceName": "contents"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"filter\"..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getFeaturedContent"
 *     resourceName : "featuredContent"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the featuredContent resource.
 * This method will execute a GET for featuredContent resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getFeaturedContent = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "filter"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getFeaturedContent",
    "signature": "params",
    "resourceName": "featuredContent"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getPlaces"
 *     resourceName : "places"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the places resource.
 * This method will execute a GET for places resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getPlaces = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getPlaces",
    "signature": "params",
    "resourceName": "places"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getStatics"
 *     resourceName : "statics"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the statics resource.
 * This method will execute a GET for statics resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getStatics = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getStatics",
    "signature": "params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "getTasks"
 *     resourceName : "tasks"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the tasks resource.
 * This method will execute a GET for tasks resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.getTasks = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "getTasks",
    "signature": "params",
    "resourceName": "tasks"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "setCheckpoints"
 *     resourceName : "checkpoints"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the checkpoints resource.
 * This method will execute a POST for checkpoints resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.setCheckpoints = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "setCheckpoints",
    "signature": "data, params",
    "resourceName": "checkpoints"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Project"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Project
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Project.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Project",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"property\""
 *     className : "osapi.jive.corev3.metadata.Property"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.metadata.Property\""
 *     proto : "{\"type\": \"property\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"availability\",\"String\"),\ndefineFie..."
 */

/**
 * define class osapi.jive.corev3.metadata.Property, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.metadata.Property", osapi.jive.corev3.AbstractObject, {"type": "property"}, []);

/**
 * Describe the fields of osapi.jive.corev3.metadata.Property
 * @type {Array}
 */
osapi.jive.corev3.metadata.Property.fields = [
defineFieldMetadata("availability","String"),
defineFieldMetadata("defaultValue","String"),
defineFieldMetadata("description","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("name","String"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("since","String"),
defineFieldMetadata("type","String"),
defineFieldMetadata("value","Object")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.metadata.Property
 * @type {Object}
 */
typeRegistry["property"] = {
    name: "property",
    ctor: osapi.jive.corev3.metadata.Property
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"resource\""
 *     className : "osapi.jive.corev3.metadata.Resource"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.metadata.Resource\""
 *     proto : "{\"type\": \"resource\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"availability\",\"String\"),\ndefineFie..."
 */

/**
 * define class osapi.jive.corev3.metadata.Resource, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.metadata.Resource", osapi.jive.corev3.AbstractObject, {"type": "resource"}, []);

/**
 * Describe the fields of osapi.jive.corev3.metadata.Resource
 * @type {Array}
 */
osapi.jive.corev3.metadata.Resource.fields = [
defineFieldMetadata("availability","String"),
defineFieldMetadata("description","String"),
defineFieldMetadata("example","String"),
defineFieldMetadata("hasBody","Boolean"),
defineFieldMetadata("id","String"),
defineFieldMetadata("jsMethod","String"),
defineFieldMetadata("name","String"),
defineFieldMetadata("path","String"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("since","String"),
defineFieldMetadata("unpublished","Boolean"),
defineFieldMetadata("verb","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.metadata.Resource
 * @type {Object}
 */
typeRegistry["resource"] = {
    name: "resource",
    ctor: osapi.jive.corev3.metadata.Resource
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"securityGroup\""
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.admin.SecurityGroup\""
 *     proto : "{\"type\": \"securityGroup\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"administratorCount\",\"Integer\"),\nde..."
 */

/**
 * define class osapi.jive.corev3.admin.SecurityGroup, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.admin.SecurityGroup", osapi.jive.corev3.AbstractObject, {"type": "securityGroup"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.admin.SecurityGroup
 * @type {Array}
 */
osapi.jive.corev3.admin.SecurityGroup.fields = [
defineFieldMetadata("administratorCount","Integer"),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("federated","Boolean",null,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("memberCount","Integer"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("properties","Object",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.admin.SecurityGroup
 * @type {Object}
 */
typeRegistry["securityGroup"] = {
    name: "securityGroup",
    ctor: osapi.jive.corev3.admin.SecurityGroup
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "createAdministrators"
 *     resourceName : "administrators"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the administrators resource.
 * This method will execute a POST for administrators resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.createAdministrators = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "createAdministrators",
    "signature": "data, params",
    "resourceName": "administrators"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "createMembers"
 *     resourceName : "members"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the members resource.
 * This method will execute a POST for members resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.createMembers = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "createMembers",
    "signature": "data, params",
    "resourceName": "members"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "getAdministrators"
 *     resourceName : "administrators"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the administrators resource.
 * This method will execute a GET for administrators resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.getAdministrators = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "getAdministrators",
    "signature": "params",
    "resourceName": "administrators"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "getMembers"
 *     resourceName : "members"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the members resource.
 * This method will execute a GET for members resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.getMembers = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "getMembers",
    "signature": "params",
    "resourceName": "members"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"PUT\",\n    \"cl..."
 *     className : "osapi.jive.corev3.admin.SecurityGroup"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.admin.SecurityGroup
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.admin.SecurityGroup.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.admin.SecurityGroup",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"share\""
 *     className : "osapi.jive.corev3.communications.Share"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.communications.Share\""
 *     proto : "{\"type\": \"share\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.communications.Share, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.communications.Share", osapi.jive.corev3.AbstractObject, {"type": "share"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.communications.Share
 * @type {Array}
 */
osapi.jive.corev3.communications.Share.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("participants","Person[]","person",false,false,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("sharedContent","Entity","any"),
defineFieldMetadata("sharedPlace","Place","any"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.communications.Share
 * @type {Object}
 */
typeRegistry["share"] = {
    name: "share",
    ctor: osapi.jive.corev3.communications.Share
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"count\",..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "count",
        "excludeReplies",
        "fields",
        "filters",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.communications.Share"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.communications.Share
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.communications.Share.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.communications.Share",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"slide\""
 *     className : "osapi.jive.corev3.contents.Slide"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Slide\""
 *     proto : "{\"type\": \"slide\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Slide, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Slide", osapi.jive.corev3.AbstractObject, {"type": "slide"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Slide
 * @type {Array}
 */
osapi.jive.corev3.contents.Slide.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("image","String",null,true,true),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("publishDate","Date",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("sortKey","Integer",null,true),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("targetLink","String",null,true,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Slide
 * @type {Object}
 */
typeRegistry["slide"] = {
    name: "slide",
    ctor: osapi.jive.corev3.contents.Slide
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.contents.Slide"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Slide
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Slide.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Slide",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"space\""
 *     className : "osapi.jive.corev3.places.Space"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.places.Space\""
 *     proto : "{\"type\": \"space\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"childCount\",\"Integer\"),\ndefineFiel..."
 */

/**
 * define class osapi.jive.corev3.places.Space, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Space", osapi.jive.corev3.AbstractObject, {"type": "space"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.places.Space
 * @type {Array}
 */
osapi.jive.corev3.places.Space.fields = [
defineFieldMetadata("childCount","Integer"),
defineFieldMetadata("contentTypes","String[]",null,true,false,true),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("displayName","String",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("locale","String",null,true),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("parent","String",null,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean",null,true)
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Space
 * @type {Object}
 */
typeRegistry["space"] = {
    name: "space",
    ctor: osapi.jive.corev3.places.Space
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "createAnnouncement"
 *     resourceName : "announcements"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the announcements resource.
 * This method will execute a POST for announcements resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.createAnnouncement = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {"type": "announcement"},
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "createAnnouncement",
    "signature": "data, params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"uri\"],\n    \"httpMethod\": \"POST\",\n ..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "createAvatar"
 *     resourceName : "avatar"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the avatar resource.
 * This method will execute a POST for avatar resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.createAvatar = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["uri"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "createAvatar",
    "signature": "params",
    "resourceName": "avatar",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"autoCategorize\",\n        ..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "createCategory"
 *     resourceName : "categories"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the categories resource.
 * This method will execute a POST for categories resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.createCategory = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "autoCategorize",
        "fields"
    ],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "createCategory",
    "signature": "data, params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "createStatic"
 *     resourceName : "statics"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the statics resource.
 * This method will execute a POST for statics resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.createStatic = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "createStatic",
    "signature": "data, params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "destroyAvatar"
 *     resourceName : "avatar"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the avatar resource.
 * This method will execute a DELETE for avatar resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.destroyAvatar = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "destroyAvatar",
    "signature": "",
    "resourceName": "avatar"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"activeOnly\",\n        \"cou..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getAnnouncements"
 *     resourceName : "announcements"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the announcements resource.
 * This method will execute a GET for announcements resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getAnnouncements = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "activeOnly",
        "count",
        "expiredQuery",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getAnnouncements",
    "signature": "params",
    "resourceName": "announcements"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getBlog"
 *     resourceName : "blog"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the blog resource.
 * This method will execute a GET for blog resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getBlog = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getBlog",
    "signature": "params",
    "resourceName": "blog"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getCategories"
 *     resourceName : "categories"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the categories resource.
 * This method will execute a GET for categories resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getCategories = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getCategories",
    "signature": "params",
    "resourceName": "categories"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getContents"
 *     resourceName : "contents"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the contents resource.
 * This method will execute a GET for contents resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getContents = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getContents",
    "signature": "params",
    "resourceName": "contents"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"filter\"..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getFeaturedContent"
 *     resourceName : "featuredContent"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the featuredContent resource.
 * This method will execute a GET for featuredContent resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getFeaturedContent = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "filter"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getFeaturedContent",
    "signature": "params",
    "resourceName": "featuredContent"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getPlaces"
 *     resourceName : "places"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the places resource.
 * This method will execute a GET for places resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getPlaces = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "sort",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getPlaces",
    "signature": "params",
    "resourceName": "places"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "getStatics"
 *     resourceName : "statics"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the statics resource.
 * This method will execute a GET for statics resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.getStatics = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "getStatics",
    "signature": "params",
    "resourceName": "statics"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Space"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Space
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Space.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Space",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"static\""
 *     className : "osapi.jive.corev3.places.Static"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.places.Static\""
 *     proto : "{\"type\": \"static\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.places.Static, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.places.Static", osapi.jive.corev3.AbstractObject, {"type": "static"}, []);

/**
 * Describe the fields of osapi.jive.corev3.places.Static
 * @type {Array}
 */
osapi.jive.corev3.places.Static.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("description","String",null,true),
defineFieldMetadata("filename","String",null,false,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("place","Place","any"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("tags","String[]",null,false,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.places.Static
 * @type {Object}
 */
typeRegistry["static"] = {
    name: "static",
    ctor: osapi.jive.corev3.places.Static
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.places.Static"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Static
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.places.Static.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.places.Static",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.places.Static"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Static
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.places.Static.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.places.Static",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.places.Static"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.places.Static
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.places.Static.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.places.Static",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"stream\""
 *     className : "osapi.jive.corev3.activities.Stream"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.activities.Stream\""
 *     proto : "{\"type\": \"stream\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"id\",\"String\"),\ndefineFieldMetadata..."
 */

/**
 * define class osapi.jive.corev3.activities.Stream, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.activities.Stream", osapi.jive.corev3.AbstractObject, {"type": "stream"}, []);

/**
 * Describe the fields of osapi.jive.corev3.activities.Stream
 * @type {Array}
 */
osapi.jive.corev3.activities.Stream.fields = [
defineFieldMetadata("id","String"),
defineFieldMetadata("name","String",null,true,true),
defineFieldMetadata("person","Person","person"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("receiveEmails","Boolean",null,true),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("source","String",null,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.activities.Stream
 * @type {Object}
 */
typeRegistry["stream"] = {
    name: "stream",
    ctor: osapi.jive.corev3.activities.Stream
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "createAssociations"
 *     resourceName : "associations"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the associations resource.
 * This method will execute a POST for associations resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.createAssociations = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "createAssociations",
    "signature": "data, params",
    "resourceName": "associations"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "destroyAssociations"
 *     resourceName : "associations"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the associations resource.
 * This method will execute a DELETE for associations resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.destroyAssociations = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "destroyAssociations",
    "signature": "",
    "resourceName": "associations"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"after\",\n        \"before\",..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "getActivity"
 *     resourceName : "activity"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the activity resource.
 * This method will execute a GET for activity resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.getActivity = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "after",
        "before",
        "count",
        "fields"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "getActivity",
    "signature": "params",
    "resourceName": "activity"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "getAssociations"
 *     resourceName : "associations"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the associations resource.
 * This method will execute a GET for associations resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.getAssociations = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "filter",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "getAssociations",
    "signature": "params",
    "resourceName": "associations"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"PUT\",..."
 *     className : "osapi.jive.corev3.activities.Stream"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.Stream
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.activities.Stream.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.activities.Stream",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"streamEntry\""
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.activities.StreamEntry\""
 *     proto : "{\"type\": \"streamEntry\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.activities.StreamEntry, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.activities.StreamEntry", osapi.jive.corev3.AbstractObject, {"type": "streamEntry"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.activities.StreamEntry
 * @type {Array}
 */
osapi.jive.corev3.activities.StreamEntry.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("verb","String"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.activities.StreamEntry
 * @type {Object}
 */
typeRegistry["streamEntry"] = {
    name: "streamEntry",
    ctor: osapi.jive.corev3.activities.StreamEntry
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"count\",..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.activities.StreamEntry"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.activities.StreamEntry
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.activities.StreamEntry.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.activities.StreamEntry",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"task\""
 *     className : "osapi.jive.corev3.contents.Task"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Task\""
 *     proto : "{\"type\": \"task\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Task, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Task", osapi.jive.corev3.AbstractObject, {"type": "task"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Task
 * @type {Array}
 */
osapi.jive.corev3.contents.Task.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("completed","Boolean",null,true),
defineFieldMetadata("content","ContentBody","contentBody",true),
defineFieldMetadata("dueDate","Date",null,true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("owner","String",null,true),
defineFieldMetadata("parent","String",null,true,true),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("parentTask","String",null,true),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subTasks","String[]",null,false,false,true),
defineFieldMetadata("subject","String",null,true,true),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Task
 * @type {Object}
 */
typeRegistry["task"] = {
    name: "task",
    ctor: osapi.jive.corev3.contents.Task
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Task"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Task
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Task.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Task",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"timeZone\""
 *     className : "osapi.jive.corev3.metadata.TimeZone"
 *     extraMethods : "[]"
 *     classNameString : "\"osapi.jive.corev3.metadata.TimeZone\""
 *     proto : "{\"type\": \"timeZone\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"displayName\",\"String\"),\ndefineFiel..."
 */

/**
 * define class osapi.jive.corev3.metadata.TimeZone, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.metadata.TimeZone", osapi.jive.corev3.AbstractObject, {"type": "timeZone"}, []);

/**
 * Describe the fields of osapi.jive.corev3.metadata.TimeZone
 * @type {Array}
 */
osapi.jive.corev3.metadata.TimeZone.fields = [
defineFieldMetadata("displayName","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("rawOffset","Integer"),
defineFieldMetadata("resources","Object")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.metadata.TimeZone
 * @type {Object}
 */
typeRegistry["timeZone"] = {
    name: "timeZone",
    ctor: osapi.jive.corev3.metadata.TimeZone
};

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"update\""
 *     className : "osapi.jive.corev3.contents.Update"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.Update\""
 *     proto : "{\"type\": \"update\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"author\",\"Person\",\"person\"),\ndefine..."
 */

/**
 * define class osapi.jive.corev3.contents.Update, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.Update", osapi.jive.corev3.AbstractObject, {"type": "update"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.Update
 * @type {Array}
 */
osapi.jive.corev3.contents.Update.fields = [
defineFieldMetadata("author","Person","person"),
defineFieldMetadata("content","ContentBody","contentBody",true,true),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("highlightBody","String"),
defineFieldMetadata("highlightSubject","String"),
defineFieldMetadata("highlightTags","String"),
defineFieldMetadata("id","String"),
defineFieldMetadata("latitude","Number"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("longitude","Number"),
defineFieldMetadata("parent","String"),
defineFieldMetadata("parentContent","Summary","summary"),
defineFieldMetadata("parentPlace","Summary","summary"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("replyCount","Integer"),
defineFieldMetadata("repost","Update","update"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("status","String"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String",null,false,true),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("viewCount","Integer"),
defineFieldMetadata("visibleToExternalContributors","Boolean")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.Update
 * @type {Object}
 */
typeRegistry["update"] = {
    name: "update",
    ctor: osapi.jive.corev3.contents.Update
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\n        \"author\",\n        \"fields\"..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "createComment"
 *     resourceName : "comments"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the comments resource.
 * This method will execute a POST for comments resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.createComment = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "author",
        "fields"
    ],
    "httpMethod": "POST",
    "paramOverrides": {
        "parent": "@this.resources.self.ref",
        "type": "comment"
    },
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "createComment",
    "signature": "data, params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "createExtProps"
 *     resourceName : "extprops"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the extprops resource.
 * This method will execute a POST for extprops resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.createExtProps = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "createExtProps",
    "signature": "data, params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"POST\"..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "createOutcome"
 *     resourceName : "outcomes"
 *     signature : "data, params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the outcomes resource.
 * This method will execute a POST for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.createOutcome = function(data, params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "createOutcome",
    "signature": "data, params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "deleteExtProps"
 *     resourceName : "extprops"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the extprops resource.
 * This method will execute a DELETE for extprops resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.deleteExtProps = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "deleteExtProps",
    "signature": "",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "destroy"
 *     resourceName : "self"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the self resource.
 * This method will execute a DELETE for self resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.destroy = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "destroy",
    "signature": "",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getChildOutcomeTypes"
 *     resourceName : "childOutcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the childOutcomeTypes resource.
 * This method will execute a GET for childOutcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getChildOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "isCreate",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getChildOutcomeTypes",
    "signature": "params",
    "resourceName": "childOutcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"anchor\",\n        \"author\"..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getComments"
 *     resourceName : "comments"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the comments resource.
 * This method will execute a GET for comments resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getComments = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "anchor",
        "author",
        "count",
        "excludeReplies",
        "fields",
        "filter",
        "hierarchical",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getComments",
    "signature": "params",
    "resourceName": "comments"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getContentImages"
 *     resourceName : "images"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the images resource.
 * This method will execute a GET for images resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getContentImages = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getContentImages",
    "signature": "params",
    "resourceName": "images"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getExtProps"
 *     resourceName : "extprops"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the extprops resource.
 * This method will execute a GET for extprops resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getExtProps = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getExtProps",
    "signature": "params",
    "resourceName": "extprops"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getFollowingIn"
 *     resourceName : "followingIn"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the followingIn resource.
 * This method will execute a GET for followingIn resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getFollowingIn = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getFollowingIn",
    "signature": "params",
    "resourceName": "followingIn"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getLikes"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the likes resource.
 * This method will execute a GET for likes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getLikes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getLikes",
    "signature": "params",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getOutcomeTypes"
 *     resourceName : "outcomeTypes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the outcomeTypes resource.
 * This method will execute a GET for outcomeTypes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getOutcomeTypes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getOutcomeTypes",
    "signature": "params",
    "resourceName": "outcomeTypes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\n        \"count\",\n        \"fields\",..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "getOutcomes"
 *     resourceName : "outcomes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the outcomes resource.
 * This method will execute a GET for outcomes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.getOutcomes = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "count",
        "fields",
        "includeChildrenOutcomes",
        "startIndex"
    ],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "getOutcomes",
    "signature": "params",
    "resourceName": "outcomes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "like"
 *     resourceName : "likes"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the likes resource.
 * This method will execute a POST for likes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.like = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "like",
    "signature": "params",
    "resourceName": "likes",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "POST"
 *     methodDef : "{\n    \"queryParams\": [],\n    \"httpMethod\": \"POST\",\n    \"c..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "markRead"
 *     resourceName : "read"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the read resource.
 * This method will execute a POST for read resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.markRead = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [],
    "httpMethod": "POST",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "markRead",
    "signature": "params",
    "resourceName": "read",
    "hasBody": false
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "markUnread"
 *     resourceName : "read"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the read resource.
 * This method will execute a DELETE for read resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.markUnread = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "markUnread",
    "signature": "",
    "resourceName": "read"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "DELETE"
 *     methodDef : "{\n    \"httpMethod\": \"DELETE\",\n    \"className\": \"osapi.jiv..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "unlike"
 *     resourceName : "likes"
 *     signature : ""
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the likes resource.
 * This method will execute a DELETE for likes resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.unlike = function() { [generated code] }

 */ defineInstanceMethod({
    "httpMethod": "DELETE",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "unlike",
    "signature": "",
    "resourceName": "likes"
});
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "PUT"
 *     methodDef : "{\n    \"queryParams\": [\n        \"fields\",\n        \"minor\"\n..."
 *     className : "osapi.jive.corev3.contents.Update"
 *     methodName : "update"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.Update
 * to simplify use of the self resource.
 * This method will execute a PUT for self resources
 */ /*

 osapi.jive.corev3.contents.Update.prototype.update = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": [
        "fields",
        "minor"
    ],
    "httpMethod": "PUT",
    "className": "osapi.jive.corev3.contents.Update",
    "methodName": "update",
    "signature": "params",
    "resourceName": "self"
});

/*
 * Including JS template resource from class-definition.js
 *     typeName : "\"url\""
 *     className : "osapi.jive.corev3.contents.ExternalURL"
 *     extraMethods : "[{\"name\": \"toURI\"}]"
 *     classNameString : "\"osapi.jive.corev3.contents.ExternalURL\""
 *     proto : "{\"type\": \"url\"}"
 *     fieldMetadata : "[\ndefineFieldMetadata(\"content\",\"ContentBean\"),\ndefineFie..."
 */

/**
 * define class osapi.jive.corev3.contents.ExternalURL, to extend osapi.jive.corev3.AbstractObject
 */
defineClass("osapi.jive.corev3.contents.ExternalURL", osapi.jive.corev3.AbstractObject, {"type": "url"}, [{"name": "toURI"}]);

/**
 * Describe the fields of osapi.jive.corev3.contents.ExternalURL
 * @type {Array}
 */
osapi.jive.corev3.contents.ExternalURL.fields = [
defineFieldMetadata("content","ContentBean"),
defineFieldMetadata("followerCount","Integer"),
defineFieldMetadata("id","String"),
defineFieldMetadata("likeCount","Integer"),
defineFieldMetadata("published","Date"),
defineFieldMetadata("resources","Object"),
defineFieldMetadata("subject","String"),
defineFieldMetadata("tags","String[]",null,true,false,true),
defineFieldMetadata("type","String"),
defineFieldMetadata("updated","Date"),
defineFieldMetadata("url","String")
];

/**
 * Add an entry to the type registry for
 * osapi.jive.corev3.contents.ExternalURL
 * @type {Object}
 */
typeRegistry["url"] = {
    name: "url",
    ctor: osapi.jive.corev3.contents.ExternalURL
};
/*
 * Including JS template resource from resource-method.js
 *     httpMethod : "GET"
 *     methodDef : "{\n    \"queryParams\": [\"fields\"],\n    \"httpMethod\": \"GET\",..."
 *     className : "osapi.jive.corev3.contents.ExternalURL"
 *     methodName : "get"
 *     resourceName : "self"
 *     signature : "params"
 */

/**
 * Adds a dynamic convenience method to osapi.jive.corev3.contents.ExternalURL
 * to simplify use of the self resource.
 * This method will execute a GET for self resources
 */ /*

 osapi.jive.corev3.contents.ExternalURL.prototype.get = function(params) { [generated code] }

 */ defineInstanceMethod({
    "queryParams": ["fields"],
    "httpMethod": "GET",
    "className": "osapi.jive.corev3.contents.ExternalURL",
    "methodName": "get",
    "signature": "params",
    "resourceName": "self"
});


/***[ Explicit Customizations ]***\
*                                  ********************************************\
* This section contains manual customizations to the core JS API               *
*                                                                              *
* Customization JavaScript is defined in the Spring mergeable collection       *
* 'javaScriptServiceCustomizationsV3'                                          *
\******************************************************************************/

/*
 * Including JS template resource from custom-getByEntityDescriptor.js
 */

defineStatic({
    "queryParams": ["fields", "filter"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.places.getByEntityDescriptor",
    "endpoint": "/places"
});

defineStatic({
    "queryParams": ["fields", "filter"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.contents.getByEntityDescriptor",
    "endpoint": "/contents"
});

defineStatic({
    "queryParams": ["fields", "filter"],
    "httpMethod": "GET",
    "name": "osapi.jive.corev3.people.getByEntityDescriptor",
    "endpoint": "/people"
});


/*
 * Including JS template resource from run-last.js
 */

/**
 * Triggers execution of all queued load handlers
 */
registerOnLoadHandler(registerOnLoadHandler);

})(); // end of scoping function
