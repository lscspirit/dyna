'use strict';

var compare      = require('../utils/compare');
var recipes      = require('../core/provider_recipes');
var assign       = require('object-assign');

var Action = require('./action');
var stores = require('./stores');

var _components = {};

/**
 * Provide a context for defining Components
 * @param {componentDefCallback} callback - callback function that handles the component definition logic
 * @example
 * defineComponents(function($components, $stores, $Action, React, $) {
 *   var SomeComponent = React.createClass({
 *     //...
 *   });
 *
 *   $components.registerComponent('SomeComponent', SomeComponent);
 * });
 */
function defineComponents(callback) {
  var external_lib = require('../core/external_lib').libs;
  var React  = external_lib.React;
  var jQuery = external_lib.$;

  callback(
    { registerComponent: registerComponent, getComponent: getComponent },
    { getStore: stores.getStore, requireStores: stores.requireStores, releaseStores: stores.releaseStores },
    Action,
    React,
    jQuery
  );
}

/**
 * Component definition context callback
 * @callback componentDefCallback
 * @param {{}}      $components - with registerComponent() and getComponent() methods
 * @param {{}}      $stores     - with getStore(), requireStores() and releaseStores() methods
 * @param {*}       $Action     - Action constructor
 * @param {Object}  React       - React JS library
 * @param {Object}  $           - jQuery Library
 */

/**
 * Register a React Component
 * @param {string}     name            - name of the component
 * @param {ReactClass} react_component - react component class
 */
function registerComponent(name, react_component) {
  if(_components[name]) {
    throw new Error('conflicting component name: "' + name+ '"');
  } else if(!compare.isString(name)) {
    throw new Error('component name must be a string');
  }

  _components[name] = react_component;
}

/**
 * Get the registered React Component
 * @param {string}     name            - name of the component
 * @returns {ReactClass} the matching react component class
 */
function getComponent(name) {
  var cache = _components[name];

  if (cache) return cache;
  else throw new Error('There is no registered Component with the name "' + name + "'");
}

//
// Exports
//

// make getComponent() available under the $components provider
recipes.value('$components', { getComponent: getComponent });

module.exports = {
  defineComponents: defineComponents,
  getComponent    : getComponent
};

