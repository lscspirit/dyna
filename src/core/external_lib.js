'use strict';

var assign = require('object-assign');

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