'use strict';

var compare = require('../utils/compare');

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
