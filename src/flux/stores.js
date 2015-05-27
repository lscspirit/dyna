'use strict';

var compare      = require('../utils/compare');
var recipes      = require('../core/provider_recipes');
var arrayUtils   = require('../utils/array_utils');
var assign       = require('object-assign');
var EventEmitter = require('event-emitter');

var eventDispatcher = require('./event_dispatcher');

/** Keep track of all registered Store constructors */
var _store_constructors = {};
/** Keep track of all Store instances */
var _context_store_instances = {};

/**
 * Provide a context for defining Stores
 * @param {storeDefCallback} callback - callback function that handles the store definition logic
 * @example
 * defineStores(function($stores) {
 *   var todoStore = function() {
 *     //...
 *     this.$processEvent = function(event) { };
 *   };
 *
 *   $stores.registerStore("todoStore", todoStore);
 * });
 */
function defineStores(callback) {
  callback(
    { registerStore: registerStore, getStore: getStore, requireStores: requireStores, releaseStores: releaseStores }
  );
}

/**
 * Store definition context callback
 * @callback storeDefCallback
 * @param {{}} $stores - with registerStore(), getStore(), requireStores() and releaseStores() methods
 */

/**
 * Register a Store
 *
 * When registering a new store, the Store object will be extended with three event methods: emitChange(), addChangeListener(),
 * removeChangeListener() and waitFor(), plus a event_dispatch_token property.
 *
 * @param {string}   name        - name of the Store
 * @param {function} constructor - constructor of the Store
 * @throws {Error} if constructor is not valid
 *
 * @example
 * var todoStore = function() {
 *   var _todo_list = ["buy milk", "clean dishes"];
 *
 *   this.getTodoList = function() { return _todo_list; };
 *
 *   this.$processEvent = function(event) {
 *     if (event.eventName() == 'todo_create') {
 *       emitChange();
 *     }
 *   };
 * };
 *
 * // Register a new Store named "todoStore"
 * stores.registerStore("todoStore", todoStore);
 * // Retrieve the "todoStore"
 * stores.getStore("todoStore");                  //=> todoStore instance
 */
function registerStore(name, constructor) {
  if(_store_constructors[name]) {
    throw new Error('conflicting store name: "' + name+ '"');
  } else if(!compare.isFunction(constructor)) {
    throw new Error('store constructor must be a function');
  } else if (!compare.isString(name)) {
    throw new Error('store name must be a string');
  }

  _store_constructors[name] = constructor;
}

/**
 * Indicate store(s) as required resource(s) in a certain context
 * Any store marked as required in a context must be released using <tt>releaseStores()</tt> when it is no longer needed.
 * @param {string|string[]} store_names - store names
 * @param {string}          [context]   - the context to create the store in. Default is global context.
 * @throws {Error} if there is no store constructor registered under any of the store names
 */
function requireStores(store_names, context) {
  var names = arrayUtils.arrayWrap(store_names);

  names.forEach(function(s) {
    var context_key = _contextStoreKey(s, context);
    var cache = _context_store_instances[context_key];

    if (cache) {
      // if the store has already been initiated in this context
      // then simply increment the reference count
      cache.reference_count++;
    } else if (cache = _store_constructors[s]){
      // otherwise initiate the store under this context
      var instance = _instantiateStore(cache);
      _context_store_instances[context_key] = {
        instance        : instance,
        reference_count : 1
      };
    } else {
      throw new Error('There is no registered Store with the name "' + s + '"');
    }
  });
}

/**
 * Release store(s) from a certain context
 * This is to release any store that was marked as required using <tt>requireStores()</tt>
 * @param {string|string[]} store_names - store names
 * @param {string}          [context]   - the context to create the store in. Default is global context.
 */
function releaseStores(store_names, context) {
  var names = arrayUtils.arrayWrap(store_names);

  names.forEach(function(s) {
    var context_key = _contextStoreKey(s, context);
    var cache = _context_store_instances[context_key];

    if (cache) {
      if (cache.reference_count > 1) cache.reference_count--;
      else delete _context_store_instances[context_key];
    }
  });
}

/**
 * Get an instance of a store for a particular context
 * @param {string} name       - name of the store
 * @param {string} [context]  - the context to create the store in. Default is global context.
 * @throws {Error} if the store has not yet been instantiated
 * @returns {Object} an instance of the store in the provided context
 */
function getStore(name, context) {
  var context_key = _contextStoreKey(name, context);
  var cache = _context_store_instances[context_key];

  if (cache) return cache.instance;
  else throw new Error('The store "' + name + '" has not yet been loaded under this context. Please use requireStores() to load any store needed.');
}

//
// Private Methods
//

/**
 * Generate a key for a store in a particular context
 * @param {string} store_name - store name
 * @param {string} [context]  - context name
 * @returns {string} a string that represents the store in a context
 * @private
 */
function _contextStoreKey(store_name, context) {
  if(compare.isString(context)) return context + '-' + store_name;
  else return '__default-' + store_name;
}

/**
 * Instantiate a Store instance
 * @param {function} constructor - Store constructor function
 * @returns {Object} an instance of the store
 * @throws {Error} if store instance does not have a $processEvent method
 * @private
 */
function _instantiateStore(constructor) {
  var instance = new constructor();

  if (!compare.isFunction(instance.$processEvent)) {
    throw new Error('Store object does not have a $processEvent method');
  } else {
    var emitter = EventEmitter();

    // add dispatcher methods
    assign(instance, {
      emitChange          : function() {
        emitter.emit('CHANGE');
      },

      addChangeListener   : function(listener) {
        emitter.on('CHANGE', listener);
      },

      removeChangeListener: function(listener) {
        emitter.off('CHANGE', listener);
      },

      waitFor             : function(tokens) {
        eventDispatcher.waitFor(tokens);
      },

      event_dispatch_token: eventDispatcher.register(instance.$processEvent.bind(instance))
    });
  }

  return instance;
}

//
// Exports
//

// make store methods except defineStores() available under the $stores provider
recipes.value('$stores', {
  getStore     : getStore,
  requireStores: requireStores,
  releaseStores: releaseStores
});

module.exports = {
  defineStores : defineStores,
  getStore     : getStore,
  requireStores: requireStores,
  releaseStores: releaseStores
};