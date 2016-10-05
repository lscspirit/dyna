'use strict';

var React = require('react');

var compare = require('../utils/compare');
var assign  = require('object-assign');

var _components = {};

/**
 * Register a React Component
 * @param {string}     name            - name of the component
 * @param {ReactClass} react_component - react component class
 *
 * @example
 * var SomeComponent = React.createClass({
 *   //...
 * });
 *
 * dyna.registerComponent('SomeComponent', SomeComponent);
 */
function registerComponent(name, react_component) {
  if(_components[name]) {
    throw new Error('Conflicting component name: "' + name+ '". Please use another name.');
  } else if(!compare.isString(name)) {
    throw new Error('Component name must be a string');
  }

  _components[name] = react_component;
}

/**
 * Get the registered React Component
 * @param {string} name - name of the component
 * @returns {ReactClass} the matching react component class
 */
function getComponent(name) {
  var cache = _components[name];

  if (cache) return cache;
  else throw new Error('There is no registered Component with the name "' + name + "'");
}

/**
 * This higher-order component creates a new React Class that is connected to
 * the provided Flux. This will add flux to the component's context. The wrapped
 * component can access the Flux instance through the 'flux' property in the context.
 *
 * @param {Flux}       flux      - flux instance
 * @param {ReactClass} component - React component to be connected
 * @returns {ReactClass} Flux connected class
 *
 * @example
 * var Connected = dyna.connectComponentToFlux(flux, SomeComponent);
 */
function connectComponentToFlux(flux, component) {
  return React.createClass({
    childContextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    getChildContext : function() {
      return {
        flux: flux.componentContext()
      };
    },

    render : function() {
      var self = this;

      // filter out the 'flux' prop that was injected by this mixin
      var filtered_props = assign({}, this.props, { ref: function(r) { self.wrappedInstance = r; } });
      return React.createElement(component, filtered_props);
    }
  });
}

//
// Exports
//

module.exports = {
  registerComponent   : registerComponent,
  getComponent        : getComponent,
  connectComponentToFlux: connectComponentToFlux
};

