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