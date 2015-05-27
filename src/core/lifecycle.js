'use strict';

var assign     = require('object-assign');
var arrayUtils = require('../utils/array_utils');

var coordin  = require('../flux/coordinators');
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
 * Start the app with coordinators
 * @param {string|string[]}           coordinators - coordinator names
 * @param {coordinatorConfigCallback} config_cb    - coordinator configuration callback
 */
function start(coordinators, config_cb) {
  coordin.startCoordinators.call(this, coordinators, config_cb);
  this.mountComponents();
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