(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dyna = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var d        = _dereq_('d')
  , callable = _dereq_('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":2,"es5-ext/object/valid-callable":11}],2:[function(_dereq_,module,exports){
'use strict';

var assign        = _dereq_('es5-ext/object/assign')
  , normalizeOpts = _dereq_('es5-ext/object/normalize-options')
  , isCallable    = _dereq_('es5-ext/object/is-callable')
  , contains      = _dereq_('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":3,"es5-ext/object/is-callable":6,"es5-ext/object/normalize-options":10,"es5-ext/string/#/contains":13}],3:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Object.assign
	: _dereq_('./shim');

},{"./is-implemented":4,"./shim":5}],4:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],5:[function(_dereq_,module,exports){
'use strict';

var keys  = _dereq_('../keys')
  , value = _dereq_('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":7,"../valid-value":12}],6:[function(_dereq_,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],7:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Object.keys
	: _dereq_('./shim');

},{"./is-implemented":8,"./shim":9}],8:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],9:[function(_dereq_,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],10:[function(_dereq_,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],11:[function(_dereq_,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],12:[function(_dereq_,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],13:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? String.prototype.contains
	: _dereq_('./shim');

},{"./is-implemented":14,"./shim":15}],14:[function(_dereq_,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],15:[function(_dereq_,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],16:[function(_dereq_,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = _dereq_('./lib/Dispatcher')

},{"./lib/Dispatcher":17}],17:[function(_dereq_,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = _dereq_('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":18}],18:[function(_dereq_,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],19:[function(_dereq_,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],20:[function(_dereq_,module,exports){
'use strict';

/**
 * Dyna Core
 * @exports core/core
 */

var assign = _dereq_('object-assign');

var Injector        = _dereq_('./injector');
var ProviderManager = _dereq_('./provider_manager');
var ProviderRecipes = _dereq_('./provider_recipes');
var ExternalLib     = _dereq_('./external_lib');
var Lifecycle       = _dereq_('./lifecycle');

var core = {
  $provider: ProviderManager,
  $injector: Injector
};

assign(core, ProviderRecipes);
assign(core, ExternalLib);
assign(core, Lifecycle);

module.exports = core;

},{"./external_lib":21,"./injector":22,"./lifecycle":23,"./provider_manager":24,"./provider_recipes":25,"object-assign":19}],21:[function(_dereq_,module,exports){
(function (global){
'use strict';

var assign = _dereq_('object-assign');

var external_libs = {
  $: (typeof window !== "undefined" ? window.$_dyna : typeof global !== "undefined" ? global.$_dyna : null),
  React: (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)
};

/**
 * Set the jQuery library to be used within this framework. If not specified, it will look
 * for <tt>$</tt> in the global scope
 * @param {Object} jQuery - jQuery object
 */
function useJQuery(jQuery) {
  external_libs.$ = jQuery;
}

/**
 * Set the ReactJS library to be used within this framework. If not specified, it will look
 * for <tt>React</tt> in the global scope
 * @param {Object} React - ReactJS library object
 */
function useReact(React) {
  external_libs.React = React;
}

var Libs = {
  useJQuery: useJQuery,
  useReact : useReact
};

assign(Libs, { libs: external_libs });

module.exports = Libs;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object-assign":19}],22:[function(_dereq_,module,exports){
'use strict';

/**
 * Dependency Injector
 *
 * @module core/injector
 * @requires module:utils/compare
 * @requires module:utils/array_utils
 * @requires module:core/provider_manager
 */

var compare    = _dereq_('../utils/compare');
var arrayUtils = _dereq_('../utils/array_utils');

var manager    = _dereq_('./provider_manager');

/** Cache of values returned by providers */
var _provider_value_cache = {};

/**
 * Invoke a function with dependencies
 * @param {Object}          thisArg - object to be bind to this when the function is invoked
 * @param {Array|function}  fn      - a function in the <tt>Dependency Injection</tt> format
 * @returns {*} return value of the execution
 * @throws {Error} throw an error if fn is not a function nor a <tt>Dependency Injection</tt> array
 *
 * @example <caption>Invoke without dependency</caption>
 * injector.invoke(this, function() { return true; });     //=> true
 *
 * @example <caption>Invoke with function dependency array</caption>
 * injector.invoke(this, ["dep_1", "dep_2", function(dep_1, dep_2) { return dep_1; }]);    //=> dep_1
 */
function invoke(thisArg, fn) {
  if (compare.isArray(fn)) {
    var last = fn.length - 1;
    if (compare.isFunction(fn[last])) {
      var deps = fn.slice(0, last);
      return fn[last].apply(thisArg, _providerValues(deps));
    } else {
      throw new Error("Last element of the dependency injection array must be a function");
    }
  } else if (compare.isFunction(fn)) {
    return fn.apply(thisArg);
  }

  throw new Error("fn is not a function nor a dependency injection array");
}

/**
 * Invoke a function with dependent providers
 * This is similar to the {@link invoke()} with the exception that the dependent provider instances are
 * loaded instead of the actual values returned by provider instance
 * @param {Object}          thisArg - object to be bind to this when the function is invoked
 * @param {Array|function}  fn      - a function in the <tt>Dependency Injection</tt> format
 * @returns {*} return value of the execution
 * @throws {Error} throw an error if fn is not a function nor a <tt>Dependency Injection</tt> array
 *
 * @example <caption>Invoke without dependency</caption>
 * injector.invokeWithProviders(this, function() { return true; });     //=> true
 *
 * @example <caption>Invoke with function dependency array</caption>
 * injector.invokeWithProviders(this, ["dep_1", "dep_2", function(dep_1_provider, dep_2_provider) { return dep_1_provider; }]);    //=> dep_1_provider
 */
function invokeWithProviders(thisArg, fn) {
  if (compare.isArray(fn)) {
    var last = fn.length - 1;
    if (compare.isFunction(fn[last])) {
      var deps = fn.slice(0, last);
      return fn[last].apply(thisArg, _providers(deps));
    } else {
      throw new Error("Last element of the dependency injection array must be a function");
    }
  } else if (compare.isFunction(fn)) {
    return fn.apply(thisArg);
  }

  throw new Error("fn is not a function nor a dependency injection array");
}

/**
 * Get the value returned by a provider
 * @param {string} provider_name - name of provider
 * @returns {*} provider value
 */
function inject(name) {
  return _loadProviderValue(name);
}

//
// Private Methods
//

/**
 * Get the value returned by a provider
 * @param {string} provider_name - name of provider
 * @returns {*} value returned by the provider
 * @private
 */
function _loadProviderValue(provider_name) {
  var cache = _provider_value_cache[provider_name];
  if (cache) return cache;

  var provider = manager.provider(provider_name);
  if (provider.$get) {
    return invoke(this, provider.$get);
  } else {
    throw new Error("Provider '" + provider_name + "' does not have a $get method");
  }
}

/**
 * Get the values returned by providers
 * @param {Array|string} providers - provider names
 * @returns {Array} an array of provider values in the same order as specified in the param
 * @private
 */
function _providerValues(providers) {
  var names  = arrayUtils.arrayWrap(providers);
  var result = [];

  for (var i = 0; i < names.length; i++) {
    result.push(_loadProviderValue(names[i]));
  }
  return result;
}

/**
 * Get the provider instances
 * @param {string[]|string} providers - provider names
 * @returns {Array} an array of provider instances (not values) in the same order as specified in the param
 * @private
 */
function _providers(providers) {
  var names  = arrayUtils.arrayWrap(providers);
  var result = [];

  for (var i = 0; i < names.length; i++) {
    result.push(manager.provider(names[i]));
  }
  return result;
}

var Injector = {
  inject: inject,
  invoke: invoke,
  invokeWithProviders: invokeWithProviders
};

// Define the Injector itself as '$injector' provider
manager.define('$injector', function() {
  this.$get = function() {
    return Injector;
  };
});

module.exports = Injector;
},{"../utils/array_utils":38,"../utils/compare":39,"./provider_manager":24}],23:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');
var arrayUtils = _dereq_('../utils/array_utils');

var coordin  = _dereq_('../flux/coordinators');
var injector = _dereq_('./injector');
var ujs      = _dereq_('./ujs');

/**
 * Config phase of the framework lifecycle
 * Configure the various services and coordinators here
 * @param {string|string[]} deps - names of providers to be configured
 * @param {function}        fn   - configuration callback function
 *
 * @example
 * dyna.config(["service_1"], function(service_1_provider) {
 *   service_1_provider.apiUrl = "http://somewhere.com/api";
 * });
 */
function config(deps, fn) {
  var dep_fn = arrayUtils.arrayWrap(deps);
  dep_fn.push(fn);
  injector.invokeWithProviders(this, dep_fn);
}

/**
 * Start the app with coordinators
 * @param {string|string[]}           coordinators - coordinator names
 * @param {coordinatorConfigCallback} config_cb    - coordinator configuration callback
 */
function start(coordinators, config_cb) {
  coordin.startCoordinators.call(this, coordinators, config_cb);
  this.mountComponents();
}

//
// Exports
//

var Lifecycle = {
  config: config,
  start : start
};

assign(Lifecycle, ujs);

module.exports = Lifecycle;
},{"../flux/coordinators":30,"../utils/array_utils":38,"./injector":22,"./ujs":26,"object-assign":19}],24:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');

/** References to all registered providers' definition */
var _provider_fns       = {};
/** Cache of provider instances */
var _provider_instances = {};

/**
 * Provider Manager
 * @constructor
 * @module core/provider_manager
 * @requires module:utils/compare
 */

/**
 * Define a new provider
 *
 * The provider function must have a $get() method that returns a service/value constructor in the
 * <tt>Dependency Injection</tt> format.
 * @see module:core/injector
 *
 * @param {string}   name - name of the provider
 * @param {function} fn   - a provider function
 *
 * @throws {Error} throw an error if name is not valid, name has already been registered with another provider or impl is not a function
 * @example <caption>Define a provider named "module_1" that provides an instance of Service</caption>
 * manager.define("module_1", function() {
 *   this.$get = ["dep_1", function(dep_1) {
 *     // Function implementation
 *     return new Service(dep_1);
 *   }];
 * });
 */
function define(name, fn) {
  if (!compare.isString(name) || name.trim().length < 3) {
    throw new Error("Invalid provider name '" + name + "'. Name must be at least 3 characters long.");
  } else if (_provider_fns[name]) {
    throw new Error("Conflicting provider name. Provider '" + name + "' has already been taken.");
  } else if (!compare.isFunction(fn)) {
    throw new Error("fn must be a function");
  } else {
    _provider_fns[name] = fn;
  }
}

/**
 * Get the provider instance
 * @param {string} provider_name - name of the provider
 * @throws {Error} throw an error if provider is not found
 * @returns {Object} the provider instance
 */
function provider(provider_name) {
  // find provider instance from cache
  var cache = _provider_instances[provider_name];
  if (cache) return cache;

  _provider_instances[provider_name] = _instantiateProvider(provider_name);
  return _provider_instances[provider_name];
}

//
// Private Methods
//

/**
 * Instantiate a provider
 * @param {string} name - name of the provider
 * @throws {Error} throw an error if provider is not found
 * @returns {Object} the provider instance
 * @private
 */
function _instantiateProvider(name) {
  var provider = _provider_fns[name];

  if (provider) {
    return new provider();
  } else {
    throw new Error("Cannot find provider with name '" + name + "'");
  }
}

var ProviderManager = {
  define  : define,
  provider: provider
};

// Define the ProviderManager itself as '$providers' provider
ProviderManager.define('$providers', function() {
  this.$get = function() {
    return ProviderManager;
  };
});

module.exports = ProviderManager;

},{"../utils/compare":39}],25:[function(_dereq_,module,exports){
'use strict';

/**
 * Provider Recipes
 *
 * @module core/provider_recipes
 * @requires module:core/provider_manager
 */

var argsCreate = _dereq_('../utils/create_with_args');
var compare    = _dereq_('../utils/compare');
var manager    = _dereq_('./provider_manager');

/**
 * Define a +Value+ provider
 * @param {string} name - provider name
 * @param {*}      val  - value
 * @example <caption>Define a value provider named "value_1" that provides the string "string_1"</caption>
 * value('value_1', 'string_1');
 */
function value(name, val) {
  manager.define(name, function() {
    this.$get = function() {
      return val;
    };
  });
}

/**
 * Define a +Factory+ provider
 * @param {string} name - provider name
 * @param {*}      fn   - service/value constructor in the <tt>Dependency Injection</tt> format
 * @see module:core/injector
 * @example <caption>Define a factory named "factory_1" that provides an instance of Service</caption>
 * factory("factory_1", ["dep_1", function(dep_1) {
 *   // Function implementation
 *   return new Service(dep_1);
 * }]);
 */
function factory(name, fn) {
  manager.define(name, function() {
    this.$get = function() {
      return fn;
    };
  });
}

/**
 * Define a +Service+ provider
 * @param {string}   name         - provider name
 * @param {function} constructor  - a constructor function in the <tt>Dependency Injection</tt> format
 * @see module:core/injector
 * @example <caption>Define a service provider named "service_1" that provides an instance of Service</caption>
 * service('service_1', ['dep_1', Service]);
 */
function service(name, constructor) {
  var fn = null;

  if (compare.isFunction(constructor)) {
    fn = function() {
      return new constructor();
    };
  } else if (compare.isArray(constructor) && constructor.length > 0) {
    var fn = constructor;
    var c  = fn[fn.length - 1];

    if (!compare.isFunction(c)) throw new Error('Last element of the Dependency Injection array must be a Function');

    fn[fn.length - 1] = function() {
      return argsCreate(c, arguments);
    };
  } else {
    throw new Error('Service constructor must either be a constructor function or a Dependency Injection array');
  }

  manager.define(name, function() {
    this.$get = fn;
  });
}

module.exports = {
  value   : value,
  factory : factory,
  service : service
};
},{"../utils/compare":39,"../utils/create_with_args":40,"./provider_manager":24}],26:[function(_dereq_,module,exports){
'use strict';

var components = _dereq_('../flux/components');

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 */
function mountComponents() {
  var $ = _dereq_('./external_lib').libs.$;
  var React = _dereq_('./external_lib').libs.React;

  var $elems = $("[data-dyna-component]");

  $elems.each(function() {
    var component_name = $(this).data("dyna-component");
    var component = components.getComponent(component_name);

    var props = $(this).data("props");

    React.render(React.createElement(component, props), this);
  });
}

/**
 * Unmount all previously mounted components
 */
function unmountComponents() {
  var $ = _dereq_('./external_lib').libs.$;
  var React = _dereq_('./external_lib').libs.React;

  var $elems = $("[data-dyna-component]");
  $elems.each(function() {
    React.unmountComponentAtNode(this);
  });
}

module.exports = {
  mountComponents   : mountComponents,
  unmountComponents : unmountComponents
};
},{"../flux/components":29,"./external_lib":21}],27:[function(_dereq_,module,exports){
'use strict';

var actionDispatcher = _dereq_('./action_dispatcher');

var Action = function(name, payload) {
  var _name    = name;
  var _payload = payload;
  var _context = undefined;

  this.name = function() {
    return _name;
  };

  this.setContext = function(context) {
    _context = context;
  };

  this.context = function() {
    return _context;
  };

  this.payload = function() {
    return _payload;
  };

  this.dispatch = function() {
    actionDispatcher.emit(this.name(), this);
  };
};

//
// Exports
//

module.exports = Action;
},{"./action_dispatcher":28}],28:[function(_dereq_,module,exports){
'use strict';

var recipes = _dereq_('../core/provider_recipes');
var EventEmitter = _dereq_('event-emitter');

var emitter = EventEmitter();

/**
 * Add a event listener
 * @param {string}    action_name - action name
 * @param {function}  listener    - listener function
 * @example
 * addListener('user_click', function(payload) {
 *   payload.position
 * });
 */
function addListener(action_name, listener) {
  emitter.on(action_name, listener);
}

/**
 * Remove a event listener
 * @param {string}    action_name - action name
 * @param {function}  listener    - listener function
 * @example
 * var listener;
 * addListener('user_click', listener = function(payload) {
 *   payload.position
 * });
 * removeListener('user_click', listener);
 */
function removeListener(action_name, listener) {
  emitter.off(action_name, listener);
}

/**
 * Emit a event
 * @param {string} action_name - action name
 * @param {{}}     payload     - payload data
 * @example
 * emit('user_click', { position: { x: 100, y: 50 } });
 */
function emit(action_name, payload) {
  emitter.emit(action_name, payload);
}

var action_dispatcher = {
  addListener     : addListener,
  removeListenter : removeListener,
  emit            : emit
};

recipes.value('$actionDispatcher', action_dispatcher);

module.exports = action_dispatcher;
},{"../core/provider_recipes":25,"event-emitter":1}],29:[function(_dereq_,module,exports){
'use strict';

var compare      = _dereq_('../utils/compare');
var recipes      = _dereq_('../core/provider_recipes');
var assign       = _dereq_('object-assign');

var Action = _dereq_('./action');
var stores = _dereq_('./stores');

var _components = {};

/**
 * Provide a context for defining Components
 * @param {componentDefCallback} callback - callback function that handles the component definition logic
 * @example
 * defineComponents(function($components, $stores, $Action, React, $) {
 *   var SomeComponent = React.createClass({
 *     //...
 *   });
 *
 *   $components.registerComponent('SomeComponent', SomeComponent);
 * });
 */
function defineComponents(callback) {
  var external_lib = _dereq_('../core/external_lib').libs;
  var React  = external_lib.React;
  var jQuery = external_lib.$;

  callback(
    { registerComponent: registerComponent, getComponent: getComponent },
    { getStore: stores.getStore, requireStores: stores.requireStores, releaseStores: stores.releaseStores },
    Action,
    React,
    jQuery
  );
}

/**
 * Component definition context callback
 * @callback componentDefCallback
 * @param {{}}      $components - with registerComponent() and getComponent() methods
 * @param {{}}      $stores     - with getStore(), requireStores() and releaseStores() methods
 * @param {*}       $Action     - Action constructor
 * @param {Object}  React       - React JS library
 * @param {Object}  $           - jQuery Library
 */

/**
 * Register a React Component
 * @param {string}     name            - name of the component
 * @param {ReactClass} react_component - react component class
 */
function registerComponent(name, react_component) {
  if(_components[name]) {
    throw new Error('conflicting component name: "' + name+ '"');
  } else if(!compare.isString(name)) {
    throw new Error('component name must be a string');
  }

  _components[name] = react_component;
}

/**
 * Get the registered React Component
 * @param {string}     name            - name of the component
 * @returns {ReactClass} the matching react component class
 */
function getComponent(name) {
  var cache = _components[name];

  if (cache) return cache;
  else throw new Error('There is no registered Component with the name "' + name + "'");
}

//
// Exports
//

// make getComponent() available under the $components provider
recipes.value('$components', { getComponent: getComponent });

module.exports = {
  defineComponents: defineComponents,
  getComponent    : getComponent
};


},{"../core/external_lib":21,"../core/provider_recipes":25,"../utils/compare":39,"./action":27,"./stores":34,"object-assign":19}],30:[function(_dereq_,module,exports){
'use strict';

var argsCreate = _dereq_('../utils/create_with_args');
var arrayUtils = _dereq_('../utils/array_utils');
var compare    = _dereq_('../utils/compare');

var recipes  = _dereq_('../core/provider_recipes');
var injector = _dereq_('../core/injector');
var stores   = _dereq_('./stores');
var Event    = _dereq_('./event');
var ActionDispatcher = _dereq_('./action_dispatcher');

var _coordinators = {};

/**
 * Provide a context for defining Coordinators
 * @param {coordinatorDefCallback} callback - callback function that handles the coordinator definition logic
 * @example
 * defineCoordinators(function($coordinators, $Event, $actionDispatcher, $stores) {
 *   var Alarm = function(speaker) {
 *     var interval_secs = 0;
 *     var interval = null;
 *
 *     // starting up
 *     this.$start = function() {
 *       interval = setInterval(function() { speaker.buzz(); }, interval_secs * 1000);
 *     };
 *
 *     // stopping
 *     this.$stop  = function() {
 *       clearInterval(interval);
 *     };
 *
 *     // configuration
 *     this.setInterval = function(seconds) {
 *       interval_secs = seconds;
 *     };
 *   };
 *
 *   $coordinators.registerCoordinator('Alarm', ['speaker', Alarm]);
 * });
 *
 * @example To configure a coordinator
 * dyna.start(["Alarm"], function(Alarm) {
 *   Alarm.setInterval(60);
 * });
 */
function defineCoordinators(callback) {
  callback(
    { registerCoordinator: registerCoordinator },
    Event,
    { addListener: ActionDispatcher.addListener, removeListener: ActionDispatcher.removeListener },
    stores
  );
}

/**
 * Coordinator definition context callback
 * @callback coordinatorDefCallback
 * @param {{}} $coordinators     - with registerCoordinator() method
 * @param {*}  $Event            - Event constructor
 * @param {*}  $actionDispatcher - Action Dispatcher with addListener() and removeListener() methods
 * @param {{}} $stores           - with getStore(), requireStores() and releaseStores() methods
 * @see {@link defineCoordinators}
 */

/**
 * Register a coordinator
 * @param {string}   name - name of the coordinator
 * @param {function} fn   - a constructor function in the <tt>Dependency Injection</tt> format
 * @throws {Error} if coordinator with the same name has already been defined
 */
function registerCoordinator(name, fn) {
  if (compare.isUndefined(_coordinators[name])) {
    _coordinators[name] = { started: false, def: fn, instance: null };
  } else throw new Error('conflicting coordinator name: "' + name+ '"');
}

/**
 * Start coordinators
 * @param {string|string[]}           coordinators - list of coordinator names
 * @param {coordinatorConfigCallback} config_cb    - coordinator configuration callback
 * @throws {Error} if coordinator is not registered or is not valid
 */
function startCoordinators(coordinator_names, config_cb) {
  var names     = arrayUtils.arrayWrap(coordinator_names);
  var instances = names.map(function(n) { return _instantiateCoordinator.call(this, n); });

  // invoke the config callback function
  if (compare.isFunction(config_cb)) config_cb.apply(this, instances);

  names.forEach(function(n) {
    var state = _coordinators[n];
    state.instance.$start.call(this);
    state.started = true;
  });
}

/**
 * Coordinator configuration callback
 * @callback coordinatorConfigCallback
 * @param {...*} coordinators - coordinator instances in the same order as the coordinator names specified in {@link startCoordinators}
 * @see {@link startCoordinators}
 */

/**
 * Stop coordinators
 * @param {string|string[]} coordinators - list of coordinator names
 * @throws {Error} if coordinator is not registered or is not running
 */
function stopCoordinators(coordinator_names) {
  var names = arrayUtils.arrayWrap(coordinator_names);
  for (var i = 0; i < names.length; i++) {
    var state = _coordinators[names[i]];

    if (!state) {
      throw new Error('Coordinator "' + names[i] + '" is not found. Please use registerCoordinator() to define one first.');
    } else if (!state.started) {
      throw new Error('Coordinator "' + names[i] + '" is not running.');
    } else {
      if (compare.isFunction(state.instance.$stop)) {
        state.instance.$stop.call(this);
      }

      state.started = true;
    }
  }
}

//
// Private Methods
//

/**
 * Instantiate (without starting) a coordinator
 * @param {string} name - name of coordinator
 * @returns {*} coordinator instance
 * @throws {Error} if coordinator is not registered or has already been initiated before
 * @private
 */
function _instantiateCoordinator(name) {
  var state = _coordinators[name];
  if (compare.isUndefined(state)) {
    throw new Error('Coordinator "' + name + '" is not found. Please use registerCoordinator() to define one first.');
  } else if (state.instance) {
    throw new Error('Coordinator "' + name + '" has already been initiated.')
  } else {
    var fn = arrayUtils.arrayWrap(state.def);
    var c = fn[fn.length - 1];
    var deps = fn.slice(0, -1);

    deps.push(function(){
      return argsCreate(c, arguments);
    });

    state.instance = injector.invoke(this, deps);
    return state.instance;
  }
}

//
// Exports
//

module.exports = {
  defineCoordinators: defineCoordinators,
  startCoordinators : startCoordinators,
  stopCoordinators  : stopCoordinators
};
},{"../core/injector":22,"../core/provider_recipes":25,"../utils/array_utils":38,"../utils/compare":39,"../utils/create_with_args":40,"./action_dispatcher":28,"./event":31,"./stores":34}],31:[function(_dereq_,module,exports){
'use strict';

var eventDispatcher = _dereq_('./event_dispatcher');

var Event = function(name, payload) {
  var _name    = name;
  var _payload = payload;
  var _context = undefined;

  this.name = function() {
    return _name;
  };

  this.setContext = function(context) {
    _context = context;
  };

  this.context = function() {
    return _context;
  };

  this.payload = function() {
    return _payload;
  };

  this.dispatch = function() {
    eventDispatcher.dispatch(this);
  };
};

//
// Exports
//

module.exports = Event;
},{"./event_dispatcher":32}],32:[function(_dereq_,module,exports){
'use strict';

var recipes = _dereq_('../core/provider_recipes');
var Flux    = _dereq_('flux');

var event_dispatcher = new Flux.Dispatcher();

recipes.value('$eventDispatcher', event_dispatcher);

module.exports = event_dispatcher;
},{"../core/provider_recipes":25,"flux":16}],33:[function(_dereq_,module,exports){
'use strict';

/**
 * Flux architecture related components
 * @exports flux/flux
 */

var assign = _dereq_('object-assign');

var Stores       = _dereq_('./stores');
var Components   = _dereq_('./components');
var Coordinators = _dereq_('./coordinators');

var DynaFlux = {
  defineStores      : Stores.defineStores,
  defineComponents  : Components.defineComponents,
  defineCoordinators: Coordinators.defineCoordinators
};

module.exports = DynaFlux;

},{"./components":29,"./coordinators":30,"./stores":34,"object-assign":19}],34:[function(_dereq_,module,exports){
'use strict';

var compare      = _dereq_('../utils/compare');
var recipes      = _dereq_('../core/provider_recipes');
var arrayUtils   = _dereq_('../utils/array_utils');
var assign       = _dereq_('object-assign');
var EventEmitter = _dereq_('event-emitter');

var eventDispatcher = _dereq_('./event_dispatcher');

/** Keep track of all registered Store constructors */
var _store_constructors = {};
/** Keep track of all Store instances */
var _context_store_instances = {};

/**
 * Provide a context for defining Stores
 * @param {storeDefCallback} callback - callback function that handles the store definition logic
 * @example
 * defineStores(function($stores) {
 *   var todoStore = function() {
 *     //...
 *     this.$processEvent = function(event) { };
 *   };
 *
 *   $stores.registerStore("todoStore", todoStore);
 * });
 */
function defineStores(callback) {
  callback(
    { registerStore: registerStore, getStore: getStore, requireStores: requireStores, releaseStores: releaseStores }
  );
}

/**
 * Store definition context callback
 * @callback storeDefCallback
 * @param {{}} $stores - with registerStore(), getStore(), requireStores() and releaseStores() methods
 */

/**
 * Register a Store
 *
 * When registering a new store, the Store object will be extended with three event methods: emitChange(), addChangeListener(),
 * removeChangeListener() and waitFor(), plus a event_dispatch_token property.
 *
 * @param {string}   name        - name of the Store
 * @param {function} constructor - constructor of the Store
 * @throws {Error} if constructor is not valid
 *
 * @example
 * var todoStore = function() {
 *   var _todo_list = ["buy milk", "clean dishes"];
 *
 *   this.getTodoList = function() { return _todo_list; };
 *
 *   this.$processEvent = function(event) {
 *     if (event.eventName() == 'todo_create') {
 *       emitChange();
 *     }
 *   };
 * };
 *
 * // Register a new Store named "todoStore"
 * stores.registerStore("todoStore", todoStore);
 * // Retrieve the "todoStore"
 * stores.getStore("todoStore");                  //=> todoStore instance
 */
function registerStore(name, constructor) {
  if(_store_constructors[name]) {
    throw new Error('conflicting store name: "' + name+ '"');
  } else if(!compare.isFunction(constructor)) {
    throw new Error('store constructor must be a function');
  } else if (!compare.isString(name)) {
    throw new Error('store name must be a string');
  }

  _store_constructors[name] = constructor;
}

/**
 * Indicate store(s) as required resource(s) in a certain context
 * Any store marked as required in a context must be released using <tt>releaseStores()</tt> when it is no longer needed.
 * @param {string|string[]} store_names - store names
 * @param {string}          [context]   - the context to create the store in. Default is global context.
 * @throws {Error} if there is no store constructor registered under any of the store names
 */
function requireStores(store_names, context) {
  var names = arrayUtils.arrayWrap(store_names);

  names.forEach(function(s) {
    var context_key = _contextStoreKey(s, context);
    var cache = _context_store_instances[context_key];

    if (cache) {
      // if the store has already been initiated in this context
      // then simply increment the reference count
      cache.reference_count++;
    } else if (cache = _store_constructors[s]){
      // otherwise initiate the store under this context
      var instance = _instantiateStore(cache);
      _context_store_instances[context_key] = {
        instance        : instance,
        reference_count : 1
      };
    } else {
      throw new Error('There is no registered Store with the name "' + s + '"');
    }
  });
}

/**
 * Release store(s) from a certain context
 * This is to release any store that was marked as required using <tt>requireStores()</tt>
 * @param {string|string[]} store_names - store names
 * @param {string}          [context]   - the context to create the store in. Default is global context.
 */
function releaseStores(store_names, context) {
  var names = arrayUtils.arrayWrap(store_names);

  names.forEach(function(s) {
    var context_key = _contextStoreKey(s, context);
    var cache = _context_store_instances[context_key];

    if (cache) {
      if (cache.reference_count > 1) cache.reference_count--;
      else delete _context_store_instances[context_key];
    }
  });
}

/**
 * Get an instance of a store for a particular context
 * @param {string} name       - name of the store
 * @param {string} [context]  - the context to create the store in. Default is global context.
 * @throws {Error} if the store has not yet been instantiated
 * @returns {Object} an instance of the store in the provided context
 */
function getStore(name, context) {
  var context_key = _contextStoreKey(name, context);
  var cache = _context_store_instances[context_key];

  if (cache) return cache.instance;
  else throw new Error('The store "' + name + '" has not yet been loaded under this context. Please use requireStores() to load any store needed.');
}

//
// Private Methods
//

/**
 * Generate a key for a store in a particular context
 * @param {string} store_name - store name
 * @param {string} [context]  - context name
 * @returns {string} a string that represents the store in a context
 * @private
 */
function _contextStoreKey(store_name, context) {
  if(compare.isString(context)) return context + '-' + store_name;
  else return '__default-' + store_name;
}

/**
 * Instantiate a Store instance
 * @param {function} constructor - Store constructor function
 * @returns {Object} an instance of the store
 * @throws {Error} if store instance does not have a $processEvent method
 * @private
 */
function _instantiateStore(constructor) {
  var instance = new constructor();

  if (!compare.isFunction(instance.$processEvent)) {
    throw new Error('Store object does not have a $processEvent method');
  } else {
    var emitter = EventEmitter();

    // add dispatcher methods
    assign(instance, {
      emitChange          : function() {
        emitter.emit('CHANGE');
      },

      addChangeListener   : function(listener) {
        emitter.on('CHANGE', listener);
      },

      removeChangeListener: function(listener) {
        emitter.off('CHANGE', listener);
      },

      waitFor             : function(tokens) {
        eventDispatcher.waitFor(tokens);
      },

      event_dispatch_token: eventDispatcher.register(instance.$processEvent.bind(instance))
    });
  }

  return instance;
}

//
// Exports
//

// make store methods except defineStores() available under the $stores provider
recipes.value('$stores', {
  getStore     : getStore,
  requireStores: requireStores,
  releaseStores: releaseStores
});

module.exports = {
  defineStores : defineStores,
  getStore     : getStore,
  requireStores: requireStores,
  releaseStores: releaseStores
};
},{"../core/provider_recipes":25,"../utils/array_utils":38,"../utils/compare":39,"./event_dispatcher":32,"event-emitter":1,"object-assign":19}],35:[function(_dereq_,module,exports){
'use strict';

var assign   = _dereq_('object-assign');
var DynaCore = _dereq_('./core/core');
var DynaFlux = _dereq_('./flux/flux');
var Utils    = _dereq_('./utils/utils');

_dereq_('./providers/providers');

var dyna = {
  version: '0.1.0',
  utils  : Utils
};

assign(dyna, DynaCore);
assign(dyna, DynaFlux);

module.exports = dyna;

},{"./core/core":20,"./flux/flux":33,"./providers/providers":37,"./utils/utils":41,"object-assign":19}],36:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');
var providerManager = _dereq_('../core/provider_manager');

var Context = function() {
  var _context = {};

  /**
   * Set a value to the context object.
   * This method is only available in the provider, but not the service itself. Hence, context
   * value can only be set during the dyna's config phase.
   * @param {string} key   - the key of the context
   * @param {*}      value - the value
   * @throws throw an error if key is not a string
   * @returns {*} the value that just got set
   */
  this.setContext = function(key, value) {
    if (!compare.isString(key)) throw new Error("Context key must be a string");

    _context[key] = value;
    return value;
  };

  this.$get = function() {
    return {
      /**
       * Get the context value by key
       * @param {string} key - the key of the context
       * @returns {*} the value set for this context
       */
      getContext : function(key) {
        return _context[key];
      },

      /**
       * Get all the context values available
       * @returns {{*}} all the available context values
       */
      getAllContext : function() {
        return _context;
      }
    };
  };
};

//
// Exports
//

providerManager.define('$context', Context);

module.exports = Context;
},{"../core/provider_manager":24,"../utils/compare":39}],37:[function(_dereq_,module,exports){
'use strict';

_dereq_('./context');
},{"./context":36}],38:[function(_dereq_,module,exports){
'use strict';


/**
 * Utility Functions for Array
 * @exports utils/array_utils
 */

var compare = _dereq_('./compare');

module.exports = {
  /**
   * Wrap any object into an array
   * @param {*} obj - object to be wrapped
   * @returns {Array} a new copy of the resulting array
   * @example
   * utils.arrayWrap(undefined);   //=> []
   * utils.arrayWrap([1, 2, 3]);   //=> [1, 2, 3]
   * utils.arrayWrap(1);           //=> [1]
   */
  arrayWrap : function(obj) {
    if (compare.isUndefined(obj) || obj === null) return [];
    else if (compare.isArray(obj)) return obj.slice(0);
    else return [obj];
  }
};
},{"./compare":39}],39:[function(_dereq_,module,exports){
'use strict';

/**
 * Comparison Utilities
 * @module utils/compare
 */

module.exports = {
  isArray : function(object) {
    return object && object.constructor === Array;
  },

  isObject : function(object) {
    return object && object.constructor === Object;
  },

  isFunction : function(object) {
    return typeof object == "function";
  },

  isString : function(object) {
    return typeof object == "string";
  },

  isNumber : function(object) {
    return typeof object == "number";
  },

  isBoolean : function(object) {
    return typeof object == "boolean";
  },

  isUndefined : function(object) {
    return typeof object == "undefined";
  },

  /**
   * Shallowly compare two objects and see if they are equal
   * @see {@link http://buildwithreact.com/article/optimizing-with-shouldcomponentupdate}
   * @param {*} objA
   * @param {*} objB
   * @returns {boolean} return true if the two objects and their members are equal
   */
  shallowEqual : function shallowEqual(objA, objB) {
    // true if the two inputs are of the same javascript object
    if (objA === objB) return true;

    var key;
    // Test for A's keys different from B.
    for (key in objA) {
      if (objA.hasOwnProperty(key) && ( !objB.hasOwnProperty(key) || objA[key] !== objB[key] )) {
        return false;
      }
    }

    // Test for B's keys missing from A.
    for (key in objB) {
      if ( objB.hasOwnProperty(key) && !objA.hasOwnProperty(key) ) {
        return false;
      }
    }

    return true;
  }
};
},{}],40:[function(_dereq_,module,exports){
module.exports = function(constructor, args) {
  'use strict';

  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
};
},{}],41:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');

var ArrayUtils = _dereq_('./array_utils');
var Compare    = _dereq_('./compare');

module.exports = assign({}, ArrayUtils, Compare);
},{"./array_utils":38,"./compare":39,"object-assign":19}]},{},[35])(35)
});