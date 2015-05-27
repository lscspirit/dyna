'use strict';

/**
 * Provider Recipes
 *
 * @module core/provider_recipes
 * @requires module:core/provider_manager
 */

var argsCreate = require('../utils/create_with_args');
var compare    = require('../utils/compare');
var manager    = require('./provider_manager');

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