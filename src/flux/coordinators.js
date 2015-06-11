'use strict';

var argsCreate = require('../utils/create_with_args');
var arrayUtils = require('../utils/array_utils');
var compare    = require('../utils/compare');

var injector = require('../core/injector');

var _coordinator_defs = {};

/**
 * Register a coordinator
 * @param {string}   name - name of the coordinator
 * @param {function} def  - a constructor function in the <tt>Dependency Injection</tt> format
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
 * dyna.registerCoordinator('Alarm', ['speaker', Alarm]);
 *
 * @example To configure a coordinator
 * dyna.start(["Alarm"], function(Alarm) {
 *   Alarm.setInterval(60);
 * });
 */
function registerCoordinator(name, def) {
  if (!compare.isUndefined(_coordinator_defs[name])) {
    throw new Error('Conflicting coordinator name: "' + name+ '". Please use another name.');
  }

  _coordinator_defs[name] = def;
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
    var fn = arrayUtils.arrayWrap(def);
    var c = fn[fn.length - 1];
    var deps = fn.slice(0, -1);

    deps.push(function(){
      return argsCreate(c, arguments);
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