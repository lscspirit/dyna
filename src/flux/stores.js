'use strict';

var compare      = require('../utils/compare');
var assign       = require('object-assign');
var EventEmitter = require('event-emitter');

/** Keep track of all registered Store specs */
var _store_specs = {};

var Store = function(flux) {
  var emitter = EventEmitter();

  var _processEvent = function() {
    return this.$processEvent.apply(this, arguments);
  };

  var event_dispatcher       = flux.eventDispatcher();
  var event_dispatcher_token = event_dispatcher.register(_processEvent.bind(this));

  /**
   * Return the Flux instance in which this Store is contained
   * @returns {{}} store() method of the Flux instance
   */
  this.flux = function() {
    return { store: flux.store };
  };

  /**
   * Emit a change event signalling a data change within the Store
   */
  this.emitChange = function() {
    if (event_dispatcher.isDispatching()) {
      // Emit change OUTSIDE of the event dispatch cycle if the EventDispatcher is dispatching
      setTimeout(function() { emitter.emit('CHANGE'); }, 0);
    } else {
      emitter.emit('CHANGE');
    }
  };

  /**
   * Add a change listener to handle the Store's data change event
   * @param {function} listener - change handler function
   */
  this.addChangeListener = function(listener) {
    emitter.on('CHANGE', listener);
  };

  /**
   * Remove a change listener
   * @param {function} listener - change handler function that was previously added
   */
  this.removeChangeListener = function(listener) {
    emitter.off('CHANGE', listener);
  };

  /**
   * Wait for other Stores to finished processing an event before processing begin in this Store
   * @param tokens
   */
  this.waitFor = function(tokens) {
    event_dispatcher.waitFor(tokens);
  };

  /**
   * Return the event dispatcher token of this Store
   * @returns {*} event dispatcher token
   */
  this.eventDispatcherToken = function() {
    return event_dispatcher_token;
  };
};

/**
 * Register a Store
 *
 * Register the specification (implementation) for a Store.
 *
 * A Store will not be instantiated at this point. The Store instance will be created when the Flux flow starts.
 * Once created, the Store instance will be extended with four event methods: emitChange(), addChangeListener(),
 * removeChangeListener() and waitFor(), plus flux() and eventDispatcherToken().
 *
 * The Store spec must include a $processEvent() method. It may also include a $initialize() method for initializing the Store.
 *
 * @param {string} name - name of the Store
 * @param {Object} spec - store specification
 * @throws {Error} if name or spec is not valid
 *
 * @example
 * // Register a new Store named "todoStore"
 * dyna.registerStore("TodoStore", {
 *   $initialize : function() {
 *     this.todo_list = [];
 *   },
 *
 *   $processEvent : function(event) {
 *     if (event.eventName() == 'todo_add') {
 *       this.addItem(event.payload());
 *     }
 *   },
 *
 *   addItem : function(item) {
 *     this.todo_list.push(item);
 *     this.emitChange();
 *   },
 *
 *   todoList : function() {
 *     return this.todo_list;
 *   }
 * });
 *
 */
function registerStore(name, spec) {
  if (_store_specs[name]) {
    throw new Error('Conflicting store name: "' + name+ '". Please use another name.');
  } else if (!compare.isString(name)) {
    throw new Error('Store name must be a string.');
  } else if (!compare.isObject(spec)) {
    throw new Error('Store spec must be an Object.');
  } else if (!compare.isFunction(spec.$processEvent)) {
    throw new Error('Store spec must included a $processEvent method.');
  }

  _store_specs[name] = spec;
}

/**
 * Instantiate a store under with a Flux
 * @param {string} name - name of the Store
 * @param {Flux}   flux - Flux instance in which to create the Store
 * @returns {Object} the Store instance
 */
function instantiateStore(name, flux) {
  var spec = _store_specs[name];

  if (compare.isUndefined(spec)) throw new Error('Store spec with name "' + '" not found. Please register it with registerStore() first.');
  else if (!compare.isObject(spec)) throw new Error('Store spec must be an Object.');

  var StoreInstance = function() {
    Store.call(this, flux);
  };

  StoreInstance.prototype = Object.create(spec);
  StoreInstance.prototype.constructor = StoreInstance;

  return new StoreInstance();
}

/**
 * Check whether a Store is registered
 * @param {string} name - name of the Store
 * @returns {boolean} true if Store with the provided name is registered; other false.
 */
function hasStore(name) {
  return !compare.isUndefined(_store_specs[name]);
}

//
// Exports
//

module.exports = {
  registerStore   : registerStore,
  hasStore        : hasStore,
  instantiateStore: instantiateStore
};