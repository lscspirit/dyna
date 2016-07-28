'use strict';

var React = require('react');
var ReactDOM = require('react-dom');

var assign     = require('object-assign');
var compare    = require('../utils/compare');
var arrayUtils = require('../utils/array_utils');
var components = require('../flux/components');

/**
 * Unmounts the React component at the DOM node
 * @callback UnmountFunction
 * @param {HTMLElement} node - a DOM Node
 */
function domUnmountFn(node) {
  React.unmountComponentAtNode(node);
};

/**
 * Connects a React components to the flux and mount it to a DOM node
 * @param {Flux}        flux      - flux instance within which this component is mounted
 * @param {HTMLElement} node      - a DOM Node
 * @param {ReactClass}  component - a React component class
 * @param {Object}      props     - props to be passed to the component
 *
 * @return {ReactElement} the rendered react element
 */
function domMountFn(flux, node, component, props) {
  var connectedComponent = this.connectComponentToFlux(flux, component);

  return ReactDOM.render(React.createElement(connectedComponent, props), node).wrappedInstance;
};

/**
 * Allow each coordinator in the Flux to mount their own specific components
 * @param {Flux} flux - instance of Flux
 */
function mountComponents(flux) {
  flux.mountComponents(domMountFn.bind(this, flux));
}

/**
 * Allow each coordinator in the Flux to unmount their own specific components
 * @param {Flux} flux - instance of Flux
 */
function unmountComponents(flux) {
  flux.unmountComponents(domUnmountFn.bind(this));
}

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 *
 * @param {Flux}        flux   - instance of Flux
 * @param {HTMLElement} [root] - DOM Node under (and including self) which dyna components will be mounted.
 */
function mountDynaComponents(flux, root) {
  var self  = this;
  var _root = compare.isUndefined(root) ? document : root;
  var elems = _queryAllAndSelfWithAttribute('data-dyna-component', _root);

  elems.forEach(function(node) {
    var component_name = node.getAttribute('data-dyna-component');
    var component = components.getComponent(component_name);

    var props = node.hasAttribute('data-props') ? JSON.parse(node.getAttribute['data-props']) : {};

    mountFn.call(self, flux, node, component, props);
  });
}

/**
 * Unmount all previously mounted components
 *
 * @param {HTMLElement} [root] - DOM Node under (and including self) which dyna components will be mounted.
 */
function unmountDynaComponents(root) {
  var self  = this;
  var _root = compare.isUndefined(root) ? document : root;
  var elems = _queryAllAndSelfWithAttribute('data-dyna-component', _root);

  elems.forEach(function(node) {
    unmountFn.call(self, node);
  });
}

//
// Private Methods
//

function _queryAllAndSelfWithAttribute(attribute, root) {
  var matched = root.querySelectorAll('[' + attribute + ']');
  var arry    = [];
  for (var i = 0; i < matched.length; i++) { arry.push(matched[i]); }

  // check self
  if (compare.isFunction(root.hasAttribute) && root.hasAttribute(attribute)) arry.unshift(root);
  return arry;
}

module.exports = {
  mountComponents       : mountComponents,
  unmountComponents     : unmountComponents,
  mountDynaComponents   : mountDynaComponents,
  unmountDynaComponents : unmountDynaComponents
};