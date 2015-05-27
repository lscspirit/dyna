'use strict';

var argsCreate = require('../utils/create_with_args');
var arrayUtils = require('../utils/array_utils');
var compare    = require('../utils/compare');

var recipes  = require('../core/provider_recipes');
var injector = require('../core/injector');
var stores   = require('./stores');
var Event    = require('./event');
var ActionDispatcher = require('./action_dispatcher');

var _coordinators = {};

/**
 * Provide a context for defining Coordinators
 * @param {coordinatorDefCallback} callback - callback function that handles the coordinator definition logic
 * @example
 * defineCoordinators(function($coordinators, $Event, $actionDispatcher, $stores) {
 *   var Alarm = function(speaker) {
 *     var interval_secs = 0;
 *     var interval = null;
 *
 *     // starting up
 *     this.$start = function() {
 *       interval = setInterval(function() { speaker.buzz(); }, interval_secs * 1000);
 *     };
 *
 *     // stopping
 *     this.$stop  = function() {
 *       clearInterval(interval);
 *     };
 *
 *     // configuration
 *     this.setInterval = function(seconds) {
 *       interval_secs = seconds;
 *     };
 *   };
 *
 *   $coordinators.registerCoordinator('Alarm', ['speaker', Alarm]);
 * });
 *
 * @example To configure a coordinator
 * dyna.start(["Alarm"], function(Alarm) {
 *   Alarm.setInterval(60);
 * });
 */
function defineCoordinators(callback) {
  callback(
    { registerCoordinator: registerCoordinator },
    Event,
    { addListener: ActionDispatcher.addListener, removeListener: ActionDispatcher.removeListener },
    stores
  );
}

/**
 * Coordinator definition context callback
 * @callback coordinatorDefCallback
 * @param {{}} $coordinators     - with registerCoordinator() method
 * @param {*}  $Event            - Event constructor
 * @param {*}  $actionDispatcher - Action Dispatcher with addListener() and removeListener() methods
 * @param {{}} $stores           - with getStore(), requireStores() and releaseStores() methods
 * @see {@link defineCoordinators}
 */

/**
 * Register a coordinator
 * @param {string}   name - name of the coordinator
 * @param {function} fn   - a constructor function in the <tt>Dependency Injection</tt> format
 * @throws {Error} if coordinator with the same name has already been defined
 */
function registerCoordinator(name, fn) {
  if (compare.isUndefined(_coordinators[name])) {
    _coordinators[name] = { started: false, def: fn, instance: null };
  } else throw new Error('conflicting coordinator name: "' + name+ '"');
}

/**
 * Start coordinators
 * @param {string|string[]}           coordinators - list of coordinator names
 * @param {coordinatorConfigCallback} config_cb    - coordinator configuration callback
 * @throws {Error} if coordinator is not registered or is not valid
 */
function startCoordinators(coordinator_names, config_cb) {
  var names     = arrayUtils.arrayWrap(coordinator_names);
  var instances = names.map(function(n) { return _instantiateCoordinator.call(this, n); });

  // invoke the config callback function
  if (compare.isFunction(config_cb)) config_cb.apply(this, instances);

  names.forEach(function(n) {
    var state = _coordinators[n];
    state.instance.$start.call(this);
    state.started = true;
  });
}

/**
 * Coordinator configuration callback
 * @callback coordinatorConfigCallback
 * @param {...*} coordinators - coordinator instances in the same order as the coordinator names specified in {@link startCoordinators}
 * @see {@link startCoordinators}
 */

/**
 * Stop coordinators
 * @param {string|string[]} coordinators - list of coordinator names
 * @throws {Error} if coordinator is not registered or is not running
 */
function stopCoordinators(coordinator_names) {
  var names = arrayUtils.arrayWrap(coordinator_names);
  for (var i = 0; i < names.length; i++) {
    var state = _coordinators[names[i]];

    if (!state) {
      throw new Error('Coordinator "' + names[i] + '" is not found. Please use registerCoordinator() to define one first.');
    } else if (!state.started) {
      throw new Error('Coordinator "' + names[i] + '" is not running.');
    } else {
      if (compare.isFunction(state.instance.$stop)) {
        state.instance.$stop.call(this);
      }

      state.started = true;
    }
  }
}

//
// Private Methods
//

/**
 * Instantiate (without starting) a coordinator
 * @param {string} name - name of coordinator
 * @returns {*} coordinator instance
 * @throws {Error} if coordinator is not registered or has already been initiated before
 * @private
 */
function _instantiateCoordinator(name) {
  var state = _coordinators[name];
  if (compare.isUndefined(state)) {
    throw new Error('Coordinator "' + name + '" is not found. Please use registerCoordinator() to define one first.');
  } else if (state.instance) {
    throw new Error('Coordinator "' + name + '" has already been initiated.')
  } else {
    var fn = arrayUtils.arrayWrap(state.def);
    var c = fn[fn.length - 1];
    var deps = fn.slice(0, -1);

    deps.push(function(){
      return argsCreate(c, arguments);
    });

    state.instance = injector.invoke(this, deps);
    return state.instance;
  }
}

//
// Exports
//

module.exports = {
  defineCoordinators: defineCoordinators,
  startCoordinators : startCoordinators,
  stopCoordinators  : stopCoordinators
};