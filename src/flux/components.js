'use strict';

var compare = require('../utils/compare');
var assign  = require('object-assign');

var _components = {};

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
 *
 * @example
 * var React = dyna.React;
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
 * Create a new React Class that is connected to the provided Flux.
 * Child component of this new React Class will all have access to this Flux
 * through the 'flux' context OR by using the dyna.DyanFluxConsumerMixin()
 *
 * @param {Flux}       flux      - flux instance
 * @param {ReactClass} component - React component to be connected
 * @returns {ReactClass} Flux connected class
 *
 * @example
 * var Connected = dyna.connectComponentToFlux(SomeComponent, flux);
 */
function connectComponentToFlux(flux, component) {
  var React      = this.React;

  return React.createClass({
    mixins : [this.DynaFluxMixin()],

    getDefaultProps : function() {
      return {
        flux: flux.componentContext()
      };
    },

    render : function() {
      var self = this;

      // filter out the 'flux' prop that was injected by this mixin
      var filtered_props = assign({}, this.props, { ref: function(r) { self.wrappedInstance = r; } });
      delete filtered_props.flux;

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

