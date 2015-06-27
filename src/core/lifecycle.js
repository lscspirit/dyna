'use strict';

var assign     = require('object-assign');
var arrayUtils = require('../utils/array_utils');
var domReady   = require('../utils/dom_ready');

var injector = require('./injector');
var ujs      = require('./ujs');

/**
 * Config phase of the framework lifecycle
 * Configure the various services and coordinators here
 * @param {string|string[]} deps - names of providers to be configured
 * @param {function}        fn   - configuration callback function
 *
 * @example
 * dyna.config(["service_1"], function(service_1_provider) {
 *   service_1_provider.apiUrl = "http://somewhere.com/api";
 * });
 */
function config(deps, fn) {
  var dep_fn = arrayUtils.arrayWrap(deps);
  dep_fn.push(fn);
  injector.invokeWithProviders(this, dep_fn);
}

/**
 * Start the app with a particular Flux.
 * As part of the process, dyna components will be mounted (either through ujs or coordinator's mount spec) to the DOM
 * elements once the DOM is ready
 * @param {Flux}             flux   - Flux instance
 * @param {Document|Element} [root] - component root under which dyna components will be mounted.
 *
 * @example <caption>Start a single Flux</caption>
 * var flux = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * dyna.start(flux);
 *
 * @example <caption>Start multiple Flux on different set of nodes</caption>
 * var flux_one = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * var flux_two = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 *
 * dyna.start(flux_one, document.getElementById('#buzzer-one'));
 * dyna.start(flux_two, document.getElementById('#buzzer-two'));
 */
function start(flux, root) {
  var self = this;
  flux.start().done(function() {
    domReady(function() {
      self.mountComponents(flux, flux.componentMountSpecs());
      self.mountDynaComponents(flux, root);
    });
  });
}

/**
 * Stop the app with a particular Flux
 * @param {Flux}             flux   - Flux instance
 * @param {Document|Element} [root] - component root under which dyna components were mounted.
 *
 * @example <caption>Stop a running Flux</caption>
 * var flux = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * dyna.start(flux);
 * dyna.stop(flux);
 */
function stop(flux, root) {
  this.unmountDynaComponents(root);
  this.unmountComponents(flux.componentMountSpecs());
  flux.stop();
}

//
// Exports
//

var Lifecycle = {
  config: config,
  start : start,
  stop  : stop
};

assign(Lifecycle, ujs);

module.exports = Lifecycle;