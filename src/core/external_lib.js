'use strict';

var assign = require('object-assign');

/**
 * Store the jQuery to dyna.$ property. The dyna framework itself does not use jQuery. This method and
 * the dyna.$ property are provided for convenience so that individual app can more easily use a consistent
 * jQuery instance rather than relying on window.$.
 *
 * @param {Object} jQuery - jQuery object
 */
function setGlobalJQuery(jQuery) {
  this.$ = jQuery;
}

var Libs = {
  setGlobalJQuery: setGlobalJQuery
};

module.exports = Libs;