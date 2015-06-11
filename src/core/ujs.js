'use strict';

var assign     = require('object-assign');
var compare    = require('../utils/compare');
var components = require('../flux/components');

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 *
 * @param {Flux} flux   - instance of Flux
 * @param {*}    [root] - component root under which dyna components will be mounted.
 *                        This can either be a DOM node, jQuery object or a selector
 */
function mountComponents(flux, root) {
  var $ = this.$;
  var React = this.React;

  var $root  = compare.isUndefined(root) ? $(':root') : $(root);
  var $elems = $root.find('[data-dyna-component]').addBack('[data-dyna-component]');

  $elems.each(function() {
    var component_name = $(this).data('dyna-component');
    var component = components.getComponent(component_name);

    var props = $(this).data('props') || {};
    assign(props, { flux: {id: flux._id(), store: flux.store, action_dispatcher: flux.actionDispatcher()} });

    React.render(React.createElement(component, props), this);
  });
}

/**
 * Unmount all previously mounted components
 *
 * @param {*} [root] - component root under which dyna components will be mounted.
 *                     This can either be a DOM node, jQuery object or a selector
 */
function unmountComponents(root) {
  var $ = this.$;
  var React = this.React;

  var $root  = compare.isUndefined(root) ? $(':root') : $(root);
  var $elems = $root.find('[data-dyna-component]').addBack('[data-dyna-component]');

  $elems.each(function() {
    React.unmountComponentAtNode(this);
  });
}

module.exports = {
  mountComponents   : mountComponents,
  unmountComponents : unmountComponents
};