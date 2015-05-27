'use strict';

var assign = require('object-assign');

var external_libs = {
  $: require('jquery'),
  React: require('react')
};

/**
 * Set the jQuery library to be used within this framework. If not specified, it will look
 * for <tt>$</tt> in the global scope
 * @param {Object} jQuery - jQuery object
 */
function useJQuery(jQuery) {
  external_libs.$ = jQuery;
}

/**
 * Set the ReactJS library to be used within this framework. If not specified, it will look
 * for <tt>React</tt> in the global scope
 * @param {Object} React - ReactJS library object
 */
function useReact(React) {
  external_libs.React = React;
}

var Libs = {
  useJQuery: useJQuery,
  useReact : useReact
};

assign(Libs, { libs: external_libs });

module.exports = Libs;