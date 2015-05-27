'use strict';

var components = require('../flux/components');

/**
 * Mounts corresponding components to DOM nodes that has "data-dyna-component" attribute set
 * The value of this attribute indicates which registered component to mount
 */
function mountComponents() {
  var $ = require('./external_lib').libs.$;
  var React = require('./external_lib').libs.React;

  var $elems = $("[data-dyna-component]");

  $elems.each(function() {
    var component_name = $(this).data("dyna-component");
    var component = components.getComponent(component_name);

    var props = $(this).data("props");

    React.render(React.createElement(component, props), this);
  });
}

/**
 * Unmount all previously mounted components
 */
function unmountComponents() {
  var $ = require('./external_lib').libs.$;
  var React = require('./external_lib').libs.React;

  var $elems = $("[data-dyna-component]");
  $elems.each(function() {
    React.unmountComponentAtNode(this);
  });
}

module.exports = {
  mountComponents   : mountComponents,
  unmountComponents : unmountComponents
};