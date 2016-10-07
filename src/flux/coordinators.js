'use strict';

var argsCreate = require('../utils/create_with_args');
var arrayUtils = require('../utils/array_utils');
var compare    = require('../utils/compare');

var injector = require('../core/injector');

var _coordinator_defs = {};

/**
 * Register a coordinator
 *
 * Coordinator can have the following methods:
 *   $start - (Required) method that starts the coordinator. This will be called when parent Flux is started.
 *                       This can optionally return a {Promise} object. If so, Flux will wait for this promise to be
 *                       resolved before the Flux will move onto the next phase of the starting process. Other coordinators
 *                       will continue to be started while the promise is waiting to be resolved.
 *   $stop  - (Optional) method that stops the coordinator. This will be called when the parent Flux is stopped.
 *   $mount - (Optional) method that will mount coordinator specific components
 *   $unmount - (Optional) method that will unmount coordinator specific components
 *
 * @param {string}          name - name of the coordinator
 * @param {Class|Function}  coordinator  - the coordinator class
 * @throws {Error} if coordinator with the same name has already been defined
 *
 * @example
 * var Alarm = function(speaker) {
 *   var interval_secs = 0;
 *   var interval = null;
 *
 *   // starting up
 *   this.$start = function() {
 *     interval = setInterval(function() { speaker.buzz(); }, interval_secs * 1000);
 *   };
 *
 *   // stopping
 *   this.$stop  = function() {
 *     clearInterval(interval);
 *   };
 *
 *   // configuration
 *   this.setInterval = function(seconds) {
 *     interval_secs = seconds;
 *   };
 * };
 *
 * // defines the dependencies of the coordinator
 * Alarm.dependencies = ['speaker'];
 *
 * dyna.registerCoordinator('Alarm', Alarm);
 *
 * @example To configure a coordinator
 * dyna.start(["Alarm"], function(Alarm) {
 *   Alarm.setInterval(60);
 * });
 */
function registerCoordinator(name, coordinator) {
  if (!compare.isUndefined(_coordinator_defs[name])) {
    throw new Error('Conflicting coordinator name: "' + name+ '". Please use another name.');
  }

  _coordinator_defs[name] = coordinator;
}

/**
 * Instantiate (without starting) a coordinator
 * @param {string} name - name of coordinator
 * @param {Flux}   flux - Flux instance in which to create the Store
 * @returns {Object} coordinator instance
 * @throws {Error} if coordinator is not registered or has already been initiated before
 * @private
 */
function instantiateCoordinator(name, flux) {
  var def = _coordinator_defs[name];
  if (compare.isUndefined(def)) {
    throw new Error('Coordinator "' + name + '" is not found. Please use registerCoordinator() to define one first.');
  } else {
    var deps = arrayUtils.arrayWrap(def.dependencies);

    deps.push(function(){
      return argsCreate(def, arguments);
    });

    var instance = injector.invoke(this, deps);
    return _injectFlux(instance, flux);
  }
}

/**
 * Check whether a Coordinator is registered
 * @param {string} name - name of the Coordinator
 * @returns {boolean} true if Coordinator with the provided name is registered; other false.
 */
function hasCoordinator(name) {
  return !compare.isUndefined(_coordinator_defs[name]);
}

//
// Private Methods
//


/**
 * Inject the Flux instance to the <tt>flux</tt> property of the Coordinator
 * @param {Object} instance - Coordinator instance
 * @param {Flux}   flux     - Flux instance
 * @returns {Object} the coordinator instance
 * @private
 */
var _injectFlux = function(instance, flux) {
  if (instance.hasOwnProperty('flux')) throw new Error('"flux" is a reserved property in coordinator. Please use another name for your property.');

  var event_dispatcher  = flux.eventDispatcher();
  var action_dispatcher = flux.actionDispatcher();

  instance.flux = {
    store: flux.store,
    event_dispatcher : event_dispatcher,
    action_dispatcher: action_dispatcher
  };

  return instance;
};

//
// Exports
//

module.exports = {
  hasCoordinator        : hasCoordinator,
  registerCoordinator   : registerCoordinator,
  instantiateCoordinator: instantiateCoordinator
};