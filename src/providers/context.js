'use strict';

var compare = require('../utils/compare');
var providerManager = require('../core/provider_manager');

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