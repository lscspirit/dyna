'use strict';


/**
 * Utility Functions for Array
 * @exports utils/array_utils
 */

var compare = require('./compare');

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