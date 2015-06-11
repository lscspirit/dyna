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
'use strict';

var assign = _dereq_('object-assign');

/**
 * Set the jQuery library to be used within this framework. If not specified, it will look
 * for <tt>$</tt> in the global scope
 * @param {Object} jQuery - jQuery object
 */
function useJQuery(jQuery) {
  this.$ = jQuery;
}

/**
 * Set the ReactJS library to be used within this framework. If not specified, it will look
 * for <tt>React</tt> in the global scope
 * @param {Object} React - ReactJS library object
 */
function useReact(React) {
  this.React = React;
}

var Libs = {
  $        : window && window.$,
  React    : window && window.React,
  useJQuery: useJQuery,
  useReact : useReact
};

module.exports = Libs;
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
},{"../utils/array_utils":39,"../utils/compare":40,"./provider_manager":24}],23:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');
var arrayUtils = _dereq_('../utils/array_utils');

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
 * Start the app with a particular Flux
 * @param {Flux} flux   - Flux instance
 * @param {*}    [root] - component root under which dyna components will be mounted.
 *                        This can either be a DOM node, jQuery object or a selector
 *
 * @example <caption>Start a single Flux</caption>
 * var flux = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * dyna.start(flux);
 *
 * @example <caption>Start multiple Flux on different set of nodesß</caption>
 * var flux_one = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * var flux_two = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 *
 * dyna.start(flux_one, $('#buzzer-one'));
 * dyna.start(flux_two, $('#buzzer-two'));
 */
function start(flux, root) {
  flux.start();
  this.mountComponents(flux, root);
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
},{"../utils/array_utils":39,"./injector":22,"./ujs":26,"object-assign":19}],24:[function(_dereq_,module,exports){
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

},{"../utils/compare":40}],25:[function(_dereq_,module,exports){
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
},{"../utils/compare":40,"../utils/create_with_args":41,"./provider_manager":24}],26:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');
var compare    = _dereq_('../utils/compare');
var components = _dereq_('../flux/components');

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 *
 * @param {Flux} flux   - instance of Flux
 * @param {*}    [root] - component root under which dyna components will be mounted.
 *                        This can either be a DOM node, jQuery object or a selector
 */
function mountComponents(flux, root) {
  var $ = this.$;
  var React = this.React;

  var $root  = compare.isUndefined(root) ? $(':root') : $(root);
  var $elems = $root.find('[data-dyna-component]').addBack('[data-dyna-component]');

  $elems.each(function() {
    var component_name = $(this).data('dyna-component');
    var component = components.getComponent(component_name);

    var props = $(this).data('props') || {};
    assign(props, { flux: {id: flux._id(), store: flux.store, action_dispatcher: flux.actionDispatcher()} });

    React.render(React.createElement(component, props), this);
  });
}

/**
 * Unmount all previously mounted components
 *
 * @param {*} [root] - component root under which dyna components will be mounted.
 *                     This can either be a DOM node, jQuery object or a selector
 */
function unmountComponents(root) {
  var $ = this.$;
  var React = this.React;

  var $root  = compare.isUndefined(root) ? $(':root') : $(root);
  var $elems = $root.find('[data-dyna-component]').addBack('[data-dyna-component]');

  $elems.each(function() {
    React.unmountComponentAtNode(this);
  });
}

module.exports = {
  mountComponents   : mountComponents,
  unmountComponents : unmountComponents
};
},{"../flux/components":29,"../utils/compare":40,"object-assign":19}],27:[function(_dereq_,module,exports){
'use strict';

/**
 * Action object to be sent through the ActionDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Action = function(name, payload) {
  var _name    = name;
  var _payload = payload;

  /**
   * Return the name of the Action
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Action
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Action through a ActionDispatcher
   * @param {ActionDispatcher} action_dispatcher - dispatcher through which the Action is dispatched
   */
  this.dispatch = function(action_dispatcher) {
    action_dispatcher.emit(this.name(), this);
  };
};

/**
 * Create a factory object that can build Action according to the <tt>action_specs</tt>
 * @param action_specs - action specifications
 * @returns {ActionFactory} the factory object
 *
 * @example
 * var actions = dyna.createActionFactory({
 *   buzzClick: function() {
 *     return this.createAction('buzzer-clicked', 'clicked');
 *   },
 *   buzzSnooze: function() {
 *     return this.createAction('buzzer-snoozed', 'snoozed');
 *   }
 * });
 *
 * // Component
 * var Buzzer = React.createClass({
 *   // ...
 *
 *   _buzzClick : function() {
 *     var click = actions.buzzClick();
 *     click.dispatch(this.props.flux.action_dispatcher);
 *   }
 * });
 */
function createActionFactory(action_specs) {
  /**
   * Factory class for creating Actions
   * @constructor
   */
  var ActionFactory = function() {
    /**
     * Create a new Action object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Action
     * @returns {Action} - the event object @see {@link Action}
     */
    this.createAction = function(name, payload) {
      return new Action(name, payload);
    };
  };

  ActionFactory.prototype = Object.create(action_specs);
  ActionFactory.prototype.constructor = ActionFactory;

  return new ActionFactory();
}

//
// Exports
//

module.exports = { createActionFactory: createActionFactory };
},{}],28:[function(_dereq_,module,exports){
'use strict';

/**
 * Action Dispatcher
 * @module ActionDispatcher
 */

var EventEmitter = _dereq_('event-emitter');

/**
 * Action Dispatcher
 * @alias module:ActionDispatcher
 */
var ActionDispatcher = function() {
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
  this.addListener = function(action_name, listener) {
    emitter.on(action_name, listener);
  };

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
  this.removeListener = function(action_name, listener) {
    emitter.off(action_name, listener);
  };

  /**
   * Emit a event
   * @param {string} action_name - action name
   * @param {{}}     payload     - payload data
   * @example
   * emit('user_click', { position: { x: 100, y: 50 } });
   */
  this.emit = function(action_name, payload) {
    emitter.emit(action_name, payload);
  };
};

module.exports = ActionDispatcher;
},{"event-emitter":1}],29:[function(_dereq_,module,exports){
'use strict';

var compare = _dereq_('../utils/compare');
var assign  = _dereq_('object-assign');

var _components = {};

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
 *
 * @example
 * var React = dyna.React;
 * var SomeComponent = React.createClass({
 *   //...
 * });
 *
 * dyna.registerComponent('SomeComponent', SomeComponent);
 */
function registerComponent(name, react_component) {
  if(_components[name]) {
    throw new Error('Conflicting component name: "' + name+ '". Please use another name.');
  } else if(!compare.isString(name)) {
    throw new Error('Component name must be a string');
  }

  _components[name] = react_component;
}

/**
 * Get the registered React Component
 * @param {string} name - name of the component
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

module.exports = {
  registerComponent: registerComponent,
  getComponent     : getComponent
};


},{"../utils/compare":40,"object-assign":19}],30:[function(_dereq_,module,exports){
'use strict';

var argsCreate = _dereq_('../utils/create_with_args');
var arrayUtils = _dereq_('../utils/array_utils');
var compare    = _dereq_('../utils/compare');

var injector = _dereq_('../core/injector');

var _coordinator_defs = {};

/**
 * Register a coordinator
 * @param {string}   name - name of the coordinator
 * @param {function} def  - a constructor function in the <tt>Dependency Injection</tt> format
 * @throws {Error} if coordinator with the same name has already been defined
 *
 * @example
 * var Alarm = function(speaker) {
 *   var interval_secs = 0;
 *   var interval = null;
 *
 *   // starting up
 *   this.$start = function() {
 *     interval = setInterval(function() { speaker.buzz(); }, interval_secs * 1000);
 *   };
 *
 *   // stopping
 *   this.$stop  = function() {
 *     clearInterval(interval);
 *   };
 *
 *   // configuration
 *   this.setInterval = function(seconds) {
 *     interval_secs = seconds;
 *   };
 * };
 *
 * dyna.registerCoordinator('Alarm', ['speaker', Alarm]);
 *
 * @example To configure a coordinator
 * dyna.start(["Alarm"], function(Alarm) {
 *   Alarm.setInterval(60);
 * });
 */
function registerCoordinator(name, def) {
  if (!compare.isUndefined(_coordinator_defs[name])) {
    throw new Error('Conflicting coordinator name: "' + name+ '". Please use another name.');
  }

  _coordinator_defs[name] = def;
}

/**
 * Instantiate (without starting) a coordinator
 * @param {string} name - name of coordinator
 * @param {Flux}   flux - Flux instance in which to create the Store
 * @returns {Object} coordinator instance
 * @throws {Error} if coordinator is not registered or has already been initiated before
 * @private
 */
function instantiateCoordinator(name, flux) {
  var def = _coordinator_defs[name];
  if (compare.isUndefined(def)) {
    throw new Error('Coordinator "' + name + '" is not found. Please use registerCoordinator() to define one first.');
  } else {
    var fn = arrayUtils.arrayWrap(def);
    var c = fn[fn.length - 1];
    var deps = fn.slice(0, -1);

    deps.push(function(){
      return argsCreate(c, arguments);
    });

    var instance = injector.invoke(this, deps);
    return _injectFlux(instance, flux);
  }
}

/**
 * Check whether a Coordinator is registered
 * @param {string} name - name of the Coordinator
 * @returns {boolean} true if Coordinator with the provided name is registered; other false.
 */
function hasCoordinator(name) {
  return !compare.isUndefined(_coordinator_defs[name]);
}

//
// Private Methods
//


/**
 * Inject the Flux instance to the <tt>flux</tt> property of the Coordinator
 * @param {Object} instance - Coordinator instance
 * @param {Flux}   flux     - Flux instance
 * @returns {Object} the coordinator instance
 * @private
 */
var _injectFlux = function(instance, flux) {
  if (instance.hasOwnProperty('flux')) throw new Error('"flux" is a reserved property in coordinator. Please use another name for your property.');

  var event_dispatcher  = flux.eventDispatcher();
  var action_dispatcher = flux.actionDispatcher();

  instance.flux = {
    store: flux.store,
    event_dispatcher : event_dispatcher,
    action_dispatcher: action_dispatcher
  };

  return instance;
};

//
// Exports
//

module.exports = {
  hasCoordinator        : hasCoordinator,
  registerCoordinator   : registerCoordinator,
  instantiateCoordinator: instantiateCoordinator
};
},{"../core/injector":22,"../utils/array_utils":39,"../utils/compare":40,"../utils/create_with_args":41}],31:[function(_dereq_,module,exports){
'use strict';

/**
 * Event object to be sent through the EventDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Event = function(name, payload) {
  var _name    = name;
  var _payload = payload;

  /**
   * Return the name of the Event
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Event
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Event through a EventDispatcher
   * @param {EventDispatcher} event_dispatcher - dispatcher through which the Event is dispatched
   */
  this.dispatch = function(event_dispatcher) {
    event_dispatcher.dispatch(this);
  };
};

/**
 * Create a factory object that can build Action according to the <tt>event_specs</tt>
 * @param {object} event_specs - event specifications
 * @returns {EventFactory} the factory object
 *
 * @example
 * var events = dyna.createEventFactory({
 *   statusChange : function(status) {
 *     return this.createEvent('buzzer.status-change', status);
 *   },
 *   snoozed : function() {
 *     return this.createEvent('buzzer.snoozed');
 *   }
 * });
 *
 * // Coordinator
 * var Buzzer = function() {
 *   // ...
 *
 *   function _buzzStatusChange(status) {
 *     events.statusChange(status).dispatch(this.flux.event_dispatcher);
 *   }
 * }
 */
function createEventFactory(event_specs) {
  /**
   * Factory class for creating Events.
   * @constructor
   */
  var EventFactory = function() {
    /**
     * Create a new Event object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Event
     * @returns {Event} - the event object @see {@link Event}
     */
    this.createEvent = function(name, payload) {
      return new Event(name, payload);
    }
  };

  EventFactory.prototype = Object.create(event_specs);
  EventFactory.prototype.constructor = EventFactory;

  return new EventFactory();
}

//
// Exports
//

module.exports = { createEventFactory: createEventFactory };
},{}],32:[function(_dereq_,module,exports){
'use strict';

/**
 * Event Dispatcher
 * @module EventDispatcher
 */

var Flux = _dereq_('flux');

module.exports = Flux.Dispatcher;
},{"flux":16}],33:[function(_dereq_,module,exports){
'use strict';

/**
 * Flux architecture related components
 * @exports flux/flux
 */

var arrayUtils = _dereq_('../utils/array_utils');
var assign     = _dereq_('object-assign');
var compare    = _dereq_('../utils/compare');

var Stores       = _dereq_('./stores');
var Components   = _dereq_('./components');
var Coordinators = _dereq_('./coordinators');
var Actions      = _dereq_('./action');
var Events       = _dereq_('./event');

var ActionDispatcher = _dereq_('./action_dispatcher');
var EventDispatcher  = _dereq_('./event_dispatcher');

var DynaFluxMixin    = _dereq_('./mixin');

var next_flux_id = 1;

var Flux = function(coordinators, stores) {
  var self = this;
  var _id  = _generateFluxId();
  var _started = false;

  var action_dispatcher = new ActionDispatcher();
  var event_dispatcher  = new EventDispatcher();

  // inject the flux instance id to the dispatchers
  _injectFluxId(action_dispatcher, _id);
  _injectFluxId(event_dispatcher, _id);

  var required_coordinators = [], required_stores = [];
  var coordinator_instances = {}, store_instances = {};

  //
  // Accessors
  //

  this._id = function() {
    return _id;
  };

  //
  // Public Methods
  //

  this.start = function() {
    if (_started == true) throw new Error('This flux is running already.');

    // instantiate stores
    required_stores.forEach(function(s) {
      var s_instance = store_instances[s];
      // initialize store
      if (compare.isFunction(s_instance.$initialize)) s_instance.$initialize();
    });

    // instantiate coordinators
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      c_instance.$start();
    });

    _started = true;
  };

  /**
   * Flux configuration callback
   * @callback FluxConfigCallback
   * @param {...*} coordinators - coordinator instances in the same order as the coordinator names specified in Flux constructor
   */

  /**
   * Configure Flux's coordinators
   * @param {FluxConfigCallback} config_cb
   */
  this.config = function(config_cb) {
    var instances = [];

    required_coordinators.forEach(function(c) {
      instances.push(coordinator_instances[c]);
    });

    config_cb.apply(this, instances);
  };

  //
  // Accessors
  //

  this.eventDispatcher = function() {
    return event_dispatcher;
  };

  this.actionDispatcher = function() {
    return action_dispatcher;
  };

  this.store = function(name) {
    var instance = store_instances[name];
    if (compare.isUndefined(instance)) throw new Error('Store "' + name + '" is not running within this Flux.');
    return instance;
  };


  //
  // Create Coordinator and Store instances
  //

  // check whether coordinators are valid
  arrayUtils.arrayWrap(coordinators).forEach(function(c) {
    if (!Coordinators.hasCoordinator(c)) throw new Error('Coordinator "' + c + '" not found. Please make sure it has been registered.');
    required_coordinators.push(c);

    var c_instance = Coordinators.instantiateCoordinator(c, self);
    if (!compare.isFunction(c_instance.$start)) {
      throw new Error('Coordinator "' + c +  '" must have a $start() method.');
    }
    // inject the Flux instance id to the coordinator instance so that we know which flux the instance is running within
    _injectFluxId(c_instance, _id);
    coordinator_instances[c] = c_instance;
  });

  // check whether stores are valid
  arrayUtils.arrayWrap(stores).forEach(function(s) {
    if (!Stores.hasStore(s)) throw new Error('Store "' + s + '" not found. Please make sure it has been registered.');
    required_stores.push(s);

    var s_instance = Stores.instantiateStore(s, self);
    // inject the Flux instance id to the store instance so that we know which flux the instance is running within
    _injectFluxId(s_instance, _id);
    store_instances[s] = s_instance;
  });
};

//
// Private Methods
//

/**
 * Generate a id for Flux instance
 * @private
 */
function _generateFluxId() {
  return next_flux_id++;
}

/**
 * Inject the Flux instance id as the <tt>_flux_id</tt> property to an Object
 * @param {Object}  obj - any object
 * @param {Integer} id  - Flux instance id
 * @private
 */
function _injectFluxId(obj, id) {
  if (obj.hasOwnProperty('_flux_id')) throw new Error('Cannot inject Flux Id. Object already has a _flux_id property.');
  obj._flux_id = id;
}

//
// Exports
//

var DynaFlux = {
  flux : function(coordinators, stores) {
    return new Flux(coordinators, stores);
  },
  registerStore      : Stores.registerStore,
  registerComponent  : Components.registerComponent,
  registerCoordinator: Coordinators.registerCoordinator,
  DynaFluxMixin      : DynaFluxMixin
};

assign(DynaFlux, Actions, Events);

module.exports = DynaFlux;

},{"../utils/array_utils":39,"../utils/compare":40,"./action":27,"./action_dispatcher":28,"./components":29,"./coordinators":30,"./event":31,"./event_dispatcher":32,"./mixin":34,"./stores":35,"object-assign":19}],34:[function(_dereq_,module,exports){
'use strict';

/**
 * Constructor for creating a DynaFluxMixin that will pass the Flux instance to child components
 *
 * @param {React} React - instance of React
 * @returns {Object} mixin definition
 * @constructor
 *
 * @see {@link https://github.com/BinaryMuse/fluxxor/blob/master/lib/flux_mixin.js}
 */
var DynaFluxMixin = function(React) {
  return {
    componentWillMount : function() {
      if (!this.props.flux && (!this.context || !this.context.flux)) {
        throw new Error('Could not find flux in component\'s props or context');
      }
    },

    childContextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    getChildContext : function() {
      return {
        flux: this.flux()
      };
    },

    flux : function() {
      return this.props.flux || (this.context && this.context.flux)
    }
  };
};

DynaFluxMixin.componentWillMount = function() {
  throw new Error('DynaFluxMixin must be created through dyna.DynaFluxMixin(React), instead of being used directly.');
};

module.exports = DynaFluxMixin;
},{}],35:[function(_dereq_,module,exports){
'use strict';

var compare      = _dereq_('../utils/compare');
var assign       = _dereq_('object-assign');
var EventEmitter = _dereq_('event-emitter');

/** Keep track of all registered Store specs */
var _store_specs = {};

var Store = function(flux) {
  var emitter = EventEmitter();

  var _processEvent = function() {
    return this.$processEvent.apply(this, arguments);
  };

  var event_dispatcher       = flux.eventDispatcher();
  var event_dispatcher_token = event_dispatcher.register(_processEvent.bind(this));

  /**
   * Return the Flux instance in which this Store is contained
   * @returns {{}} store() method of the Flux instance
   */
  this.flux = function() {
    return { store: flux.store };
  };

  /**
   * Emit a change event signalling a data change within the Store
   */
  this.emitChange = function() {
    emitter.emit('CHANGE');
  };

  /**
   * Add a change listener to handle the Store's data change event
   * @param {function} listener - change handler function
   */
  this.addChangeListener = function(listener) {
    emitter.on('CHANGE', listener);
  };

  /**
   * Remove a change listener
   * @param {function} listener - change handler function that was previously added
   */
  this.removeChangeListener = function(listener) {
    emitter.off('CHANGE', listener);
  };

  /**
   * Wait for other Stores to finished processing an event before processing begin in this Store
   * @param tokens
   */
  this.waitFor = function(tokens) {
    event_dispatcher.waitFor(tokens);
  };

  /**
   * Return the event dispatcher token of this Store
   * @returns {*} event dispatcher token
   */
  this.eventDispatcherToken = function() {
    return event_dispatcher_token;
  };
};

/**
 * Register a Store
 *
 * Register the specification (implementation) for a Store.
 *
 * A Store will not be instantiated at this point. The Store instance will be created when the Flux flow starts.
 * Once created, the Store instance will be extended with four event methods: emitChange(), addChangeListener(),
 * removeChangeListener() and waitFor(), plus flux() and eventDispatcherToken().
 *
 * The Store spec must include a $processEvent() method. It may also include a $initialize() method for initializing the Store.
 *
 * @param {string} name - name of the Store
 * @param {Object} spec - store specification
 * @throws {Error} if name or spec is not valid
 *
 * @example
 * // Register a new Store named "todoStore"
 * dyna.registerStore("TodoStore", {
 *   $initialize : function() {
 *     this.todo_list = [];
 *   },
 *
 *   $processEvent : function(event) {
 *     if (event.eventName() == 'todo_add') {
 *       this.addItem(event.payload());
 *     }
 *   },
 *
 *   addItem : function(item) {
 *     this.todo_list.push(item);
 *     this.emitChange();
 *   },
 *
 *   todoList : function() {
 *     return this.todo_list;
 *   }
 * });
 *
 */
function registerStore(name, spec) {
  if (_store_specs[name]) {
    throw new Error('Conflicting store name: "' + name+ '". Please use another name.');
  } else if (!compare.isString(name)) {
    throw new Error('Store name must be a string.');
  } else if (!compare.isObject(spec)) {
    throw new Error('Store spec must be an Object.');
  } else if (!compare.isFunction(spec.$processEvent)) {
    throw new Error('Store spec must included a $processEvent method.');
  }

  _store_specs[name] = spec;
}

/**
 * Instantiate a store under with a Flux
 * @param {string} name - name of the Store
 * @param {Flux}   flux - Flux instance in which to create the Store
 * @returns {Object} the Store instance
 */
function instantiateStore(name, flux) {
  var spec = _store_specs[name];

  if (compare.isUndefined(spec)) throw new Error('Store spec with name "' + '" not found. Please register it with registerStore() first.');
  else if (!compare.isObject(spec)) throw new Error('Store spec must be an Object.');

  var StoreInstance = function() {
    Store.call(this, flux);
  };

  StoreInstance.prototype = Object.create(spec);
  StoreInstance.prototype.constructor = StoreInstance;

  return new StoreInstance();
}

/**
 * Check whether a Store is registered
 * @param {string} name - name of the Store
 * @returns {boolean} true if Store with the provided name is registered; other false.
 */
function hasStore(name) {
  return !compare.isUndefined(_store_specs[name]);
}

//
// Exports
//

module.exports = {
  registerStore   : registerStore,
  hasStore        : hasStore,
  instantiateStore: instantiateStore
};
},{"../utils/compare":40,"event-emitter":1,"object-assign":19}],36:[function(_dereq_,module,exports){
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

},{"./core/core":20,"./flux/flux":33,"./providers/providers":38,"./utils/utils":42,"object-assign":19}],37:[function(_dereq_,module,exports){
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
},{"../core/provider_manager":24,"../utils/compare":40}],38:[function(_dereq_,module,exports){
'use strict';

_dereq_('./context');
},{"./context":37}],39:[function(_dereq_,module,exports){
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
},{"./compare":40}],40:[function(_dereq_,module,exports){
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
},{}],41:[function(_dereq_,module,exports){
module.exports = function(constructor, args) {
  'use strict';

  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
};
},{}],42:[function(_dereq_,module,exports){
'use strict';

var assign     = _dereq_('object-assign');

var ArrayUtils = _dereq_('./array_utils');
var Compare    = _dereq_('./compare');

module.exports = assign({}, ArrayUtils, Compare);
},{"./array_utils":39,"./compare":40,"object-assign":19}]},{},[36])(36)
});