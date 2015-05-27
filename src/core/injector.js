'use strict';

/**
 * Dependency Injector
 *
 * @module core/injector
 * @requires module:utils/compare
 * @requires module:utils/array_utils
 * @requires module:core/provider_manager
 */

var compare    = require('../utils/compare');
var arrayUtils = require('../utils/array_utils');

var manager    = require('./provider_manager');

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