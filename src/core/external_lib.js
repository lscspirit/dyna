'use strict';

var assign = require('object-assign');

/**
 * Set the ReactJS library to be used within this framework. If not specified, it will look
 * for <tt>React</tt> in the global scope
 * @param {Object} React - ReactJS library object
 * @param {Object} ReactDOM - React DOM Object
 */
function useReact(React, ReactDOM) {
  this.React    = React;
  this.ReactDOM = ReactDOM;
}

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
  React    : window && window.React,
  useReact : useReact,
  setGlobalJQuery: setGlobalJQuery
};

module.exports = Libs;