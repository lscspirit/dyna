'use strict';

/**
 * Flux architecture related components
 * @exports flux/flux
 */

var arrayUtils = require('../utils/array_utils');
var assign     = require('object-assign');
var compare    = require('../utils/compare');
var deferred   = require('deferred');

var Stores       = require('./stores');
var Components   = require('./components');
var Coordinators = require('./coordinators');
var Actions      = require('./action');
var Events       = require('./event');
var Bridge       = require('./bridge');

var ActionDispatcher = require('./action_dispatcher');
var EventDispatcher  = require('./event_dispatcher');

var Mixins = require('./mixins');

var next_flux_id = 1;

var Flux = function(coordinators, stores) {
  var self = this;
  var _id  = _generateFluxId();
  var _started = false;

  var action_dispatcher = new ActionDispatcher();
  var event_dispatcher  = new EventDispatcher();

  // inject the flux instance id to the dispatchers
  _injectFluxId(action_dispatcher, _id);
  _injectFluxId(event_dispatcher, _id);

  var required_coordinators = [], required_stores = [];
  var coordinator_instances = {}, store_instances = {};
  var coordinator_action_listeners = {};

  //
  // Accessors
  //

  this._id = function() {
    return _id;
  };

  //
  // Public Methods
  //

  /**
   * Start this Flux
   *
   * This will initialize (by calling $initialize()) all the specified Stores and start (by calling $start()) all the Coordinators.
   * All coordinators will be started in the order as specified in the Flux coordinator list. You may also perform asynchronous
   * operation within the $start() method and have it return a promise. Flux will finish the start process ONLY when all promise(s)
   * returned from $start() are resolved. However, only the execution order of the synchronous operations within $start() are guaranteed.
   * All asynchronous operations may be executed in any order.
   */
  this.start = function() {
    if (_started == true) throw new Error('This flux is running already.');

    // instantiate stores
    required_stores.forEach(function(s) {
      var s_instance = store_instances[s];
      // initialize store
      if (compare.isFunction(s_instance.$initialize)) s_instance.$initialize();
    });

    // start coordinators
    var instance_returns = [];
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      instance_returns.push(c_instance.$start());

      // automatically listen for actions from action_dispatcher IF
      // handlers are provided by $listen()
      if (compare.isFunction(c_instance.$listen)) {
        var listeners = c_instance.$listen();
        listeners.forEach(function(l) {
          // check listener
          if (!compare.isString(l.action)) {
            throw new Error(c + ' $listen(): Action listener event name must be a String');
          } else if (!compare.isFunction(l.handler)) {
            throw new Error(c + ' $listen(): Action listener handler must be a Function');
          }

          c_instance.flux.action_dispatcher.addListener(l.action, l.handler);
        });
      }
    });

    var promise = deferred.apply(this, instance_returns);
    promise.done(function() {
      _started = true;
    });
    return promise;
  };

  /**
   * Stop this Flux
   * This will stop (by calling $stop()) all the Coordinators
   */
  this.stop = function() {
    if (_started != true) throw new Error('This flux is not running.');

    // stop coordinators
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      var listeners  = coordinator_action_listeners[c];

      // remove all listener that were added automatically during the flux's start process
      if (compare.isArray(listeners)) {
        listeners.forEach(function(l) {
          c_instance.flux.action_dispatcher.removeListener(l.action, l.handler);
        });
      }

      // call $stop()
      if (compare.isFunction(c_instance.$stop)) c_instance.$stop();
    });

    _started = false;
  };

  /**
   * Perform $mount operation (if available) on all coordinators
   * @param {MountFunction} mountFn - a mount function
   */
  this.mountComponents = function(mountFn) {
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // get coordinator's mount spec
      if (compare.isFunction(c_instance.$mount)) c_instance.$mount(mountFn);
    });
  };

  /**
   * Perform $unmount operation (if available) on all coordinators
   * @param {UnmountFunction} unmountFn - a unmount function
   */
  this.unmountComponents = function(unmountFn) {
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // get coordinator's mount spec
      if (compare.isFunction(c_instance.$unmount)) c_instance.$unmount(unmountFn);
    });
  };

  /**
   * Flux configuration callback
   * @callback FluxConfigCallback
   * @param {...*} coordinators - coordinator instances in the same order as the coordinator names specified in Flux constructor
   */

  /**
   * Configure Flux's coordinators
   * @param {FluxConfigCallback} config_cb
   */
  this.config = function(config_cb) {
    var instances = [];

    required_coordinators.forEach(function(c) {
      instances.push(coordinator_instances[c]);
    });

    config_cb.apply(this, instances);
  };

  this.getBridge = function(name) {
    var c_instance = coordinator_instances[name];

    if (compare.isUndefined(c_instance)) throw new Error('Coordinator "' + name + '" is not running within this Flux.');
    if (compare.isUndefined(c_instance.$bridge)) throw new Error('Coordinator "' + name + '" does not have a bridge. Please implement the $bridge property in your coordinator.');
    return c_instance.$bridge;
  };

  /**
   * Flux context for use within Dyna's component
   * @typedef {Object} FluxComponentContext
   * @property {number}   id                - Flux instance ID
   * @property {function} store             - store retrieval function
   * @property {Object}   action_dispatcher - Action Dispatcher for this Flux instance
   */

  /**
   * Get the Flux context for use in React components
   * This returns the minimum Flux instance properties that are needed by React component within the Dyna framework
   * @returns {FluxComponentContext} Flux context
   */
  this.componentContext = function() {
    return { id: this._id(), store: this.store, action_dispatcher: this.actionDispatcher() };
  };

  //
  // Accessors
  //

  this.eventDispatcher = function() {
    return event_dispatcher;
  };

  this.actionDispatcher = function() {
    return action_dispatcher;
  };

  this.store = function(name) {
    var instance = store_instances[name];
    if (compare.isUndefined(instance)) throw new Error('Store "' + name + '" is not running within this Flux.');
    return instance;
  };


  //
  // Create Coordinator and Store instances
  //

  // check whether coordinators are valid
  arrayUtils.arrayWrap(coordinators).forEach(function(c) {
    if (!Coordinators.hasCoordinator(c)) throw new Error('Coordinator "' + c + '" not found. Please make sure it has been registered.');
    required_coordinators.push(c);

    var c_instance = Coordinators.instantiateCoordinator(c, self);
    if (!compare.isFunction(c_instance.$start)) {
      throw new Error('Coordinator "' + c +  '" must have a $start() method.');
    }
    // inject the Flux instance id to the coordinator instance so that we know which flux the instance is running within
    _injectFluxId(c_instance, _id);
    coordinator_instances[c] = c_instance;
  });

  // check whether stores are valid
  arrayUtils.arrayWrap(stores).forEach(function(s) {
    if (!Stores.hasStore(s)) throw new Error('Store "' + s + '" not found. Please make sure it has been registered.');
    required_stores.push(s);

    var s_instance = Stores.instantiateStore(s, self);
    // inject the Flux instance id to the store instance so that we know which flux the instance is running within
    _injectFluxId(s_instance, _id);
    store_instances[s] = s_instance;
  });
};

//
// Private Methods
//

/**
 * Generate a id for Flux instance
 * @private
 */
function _generateFluxId() {
  return next_flux_id++;
}

/**
 * Inject the Flux instance id as the <tt>_flux_id</tt> property to an Object
 * @param {Object} obj - any object
 * @param {number} id  - Flux instance id
 * @private
 */
function _injectFluxId(obj, id) {
  if (obj.hasOwnProperty('_flux_id')) throw new Error('Cannot inject Flux Id. Object already has a _flux_id property.');
  obj._flux_id = id;
}

//
// Exports
//

var DynaFlux = {
  flux : function(coordinators, stores) {
    return new Flux(coordinators, stores);
  },
  registerStore         : Stores.registerStore,
  registerComponent     : Components.registerComponent,
  connectComponentToFlux: Components.connectComponentToFlux,
  registerCoordinator   : Coordinators.registerCoordinator
};

assign(DynaFlux, Actions, Events, Bridge, Mixins);

module.exports = DynaFlux;
