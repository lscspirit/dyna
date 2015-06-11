'use strict';

var assign     = require('object-assign');
var arrayUtils = require('../utils/array_utils');

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
 * Start the app with a particular Flux
 * @param {Flux} flux   - Flux instance
 * @param {*}    [root] - component root under which dyna components will be mounted.
 *                        This can either be a DOM node, jQuery object or a selector
 *
 * @example <caption>Start a single Flux</caption>
 * var flux = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * dyna.start(flux);
 *
 * @example <caption>Start multiple Flux on different set of nodesß</caption>
 * var flux_one = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 * var flux_two = dyna.flux(["Buzzer"], ["BuzzerStore"]);
 *
 * dyna.start(flux_one, $('#buzzer-one'));
 * dyna.start(flux_two, $('#buzzer-two'));
 */
function start(flux, root) {
  flux.start();
  this.mountComponents(flux, root);
}

//
// Exports
//

var Lifecycle = {
  config: config,
  start : start
};

assign(Lifecycle, ujs);

module.exports = Lifecycle;