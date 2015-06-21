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

var DynaFluxMixin    = require('./mixin');

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
   * This will initialize (by calling $initialize()) all the specified Stores and start (by calling $start()) all the Coordinators.
   * If the $start() method of a coordinator returns a promise object, then this will wait until that promise is resolved before
   * executing the next coordinator is started. This allows the $start() method to include async calls while maintaining sequentiality
   * of the start process.
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
    var start_deferred = deferred();
    var c_instances = [];
    required_coordinators.forEach(function(c) {
      c_instances.push(coordinator_instances[c]);
    });

    // starts coordinator sequentially
    _startNextCoordinator(start_deferred, c_instances);

    return start_deferred.promise;
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
      // call $stop()
      if (compare.isFunction(c_instance.$stop)) c_instance.$stop();
    });

    _started = false;
  };

  /**
   * Return the MountSpec from all the coordinators' $mountSpec() method
   * @returns {MountSpec[]} mount specs of all the coordinators
   */
  this.componentMountSpecs = function() {
    var specs = [];
    required_coordinators.forEach(function(c) {
      var c_instance = coordinator_instances[c];
      // get coordinator's mount spec
      if (compare.isFunction(c_instance.$mountSpec)) {
        var s = c_instance.$mountSpec();
        specs = specs.concat(s);
      }
    });

    return specs;
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
 * @param {Object}  obj - any object
 * @param {Integer} id  - Flux instance id
 * @private
 */
function _injectFluxId(obj, id) {
  if (obj.hasOwnProperty('_flux_id')) throw new Error('Cannot inject Flux Id. Object already has a _flux_id property.');
  obj._flux_id = id;
}

/**
 * Sequentially execute the coordinators' $start() method. If the $start() method returns a promise, then
 * the next coordinator won't be started until this promise is resolved.
 *
 * @param {Deferred} master_defer - deferred object that will be resolved when all coordinators have started
 * @param {Object[]} list         - list of coordinator instance
 * @private
 */
function _startNextCoordinator(master_defer, list) {
  if (list.length > 0) {
    var c_instance = list.shift();
    deferred(c_instance.$start())(_startNextCoordinator.bind(this, master_defer, list));
  } else {
    master_defer.resolve();
  }
}

//
// Exports
//

var DynaFlux = {
  flux : function(coordinators, stores) {
    return new Flux(coordinators, stores);
  },
  registerStore      : Stores.registerStore,
  registerComponent  : Components.registerComponent,
  registerCoordinator: Coordinators.registerCoordinator,
  DynaFluxMixin      : DynaFluxMixin
};

assign(DynaFlux, Actions, Events, Bridge);

module.exports = DynaFlux;
