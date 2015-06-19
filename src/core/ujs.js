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
 * @param {Flux} flux   - instance of Flux
 * @param {*}    [root] - component root under which dyna components will be mounted.
 *                        This can either be a DOM node, jQuery object or a selector
 */
function mountDynaComponents(flux, root) {
  var $ = this.$;

  var $root  = compare.isUndefined(root) ? $(':root') : $(root);
  var $elems = $root.find('[data-dyna-component]').addBack('[data-dyna-component]');

  var specs = $elems.map(function() {
    var component_name = $(this).data('dyna-component');
    var component = components.getComponent(component_name);

    var props = $(this).data('props') || {};

    return { node: this, component: component, props: props };
  }).get();

  mountComponents.call(this, flux, specs);
}

/**
 * Unmount all previously mounted components
 *
 * @param {*} [root] - component root under which dyna components will be mounted.
 *                     This can either be a DOM node, jQuery object or a selector
 */
function unmountDynaComponents(root) {
  var $ = this.$;
  var React = this.React;

  var $root  = compare.isUndefined(root) ? $(':root') : $(root);
  var $elems = $root.find('[data-dyna-component]').addBack('[data-dyna-component]');

  var specs = $elems.map(function() {
    return { node: this };
  }).get();

  unmountComponents.call(this, specs);
}

module.exports = {
  mountComponents       : mountComponents,
  unmountComponents     : unmountComponents,
  mountDynaComponents   : mountDynaComponents,
  unmountDynaComponents : unmountDynaComponents
};