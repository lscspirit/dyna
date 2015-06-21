'use strict';

var assign     = require('object-assign');
var compare    = require('../utils/compare');
var arrayUtils = require('../utils/array_utils');
var components = require('../flux/components');

/**
 * @typedef {Object} MountSpec
 * @property {HTMLElement} node      - node on which the component is mounted
 * @property {ReactClass}  component - ReactClass of the component
 * @property {Object}      props     - props to be mounted along with the component
 */

/**
 * Mounts the corresponding components as specified
 * @param {Flux}        flux - instance of Flux
 * @param {MountSpec[]} specs - mounting specification
 *
 * @example
 * dyna.mountComponents(flux, [
 *   { node: document.getElementById('node-one'), component: ReactClass, props: { prop_one: 'test' } }
 * ]);
 */
function mountComponents(flux, specs) {
  var React = this.React;
  var spec_array = arrayUtils.arrayWrap(specs);

  spec_array.forEach(function(s) {
    var node      = s.node;
    var component = s.component;
    var props     = assign(s.props || {}, { flux: {id: flux._id(), store: flux.store, action_dispatcher: flux.actionDispatcher()} });

    React.render(React.createElement(component, props), node);
  });
}

/**
 * Mounts the corresponding components as specified
 * @param {MountSpec[]} specs - mounting specification
 *
 * @example
 * dyna.unmountComponents(flux, [
 *   { node: document.getElementById('node-one') }
 * ]);
 */
function unmountComponents(specs) {
  var React = this.React;
  var spec_array = arrayUtils.arrayWrap(specs);

  spec_array.forEach(function(s) {
    React.unmountComponentAtNode(s.node);
  });
}

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 *
 * @param {Flux}        flux   - instance of Flux
 * @param {HTMLElement} [root] - DOM Node under (and including self) which dyna components will be mounted.
 */
function mountDynaComponents(flux, root) {
  root      = compare.isUndefined(root) ? document : root;
  var elems = _queryAllAndSelfWithAttribute('data-dyna-component', root);

  var specs = elems.map(function(node) {
    var component_name = node.getAttribute('data-dyna-component');
    var component = components.getComponent(component_name);

    var props = node.hasAttribute('data-props') ? JSON.parse(node.getAttribute['data-props']) : {};

    return { node: node, component: component, props: props };
  });

  mountComponents.call(this, flux, specs);
}

/**
 * Unmount all previously mounted components
 *
 * @param {HTMLElement} [root] - DOM Node under (and including self) which dyna components will be mounted.
 */
function unmountDynaComponents(root) {
  root      = compare.isUndefined(root) ? document : root;
  var elems = _queryAllAndSelfWithAttribute('data-dyna-component', root);

  var specs = elems.map(function(node) {
    return { node: node };
  });

  unmountComponents.call(this, specs);
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