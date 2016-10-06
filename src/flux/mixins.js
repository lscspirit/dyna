'use strict';

var React = require('react');

var invariant = require('invariant');
var Immutable = require('immutable');

var assign  = require('object-assign');
var compare = require('../utils/compare');

/**
 * Function for creating a DynaFluxMixin that will consume the Flux instance provided by
 * the component's 'flux' prop. This will also pass the flux instance to its child through
 * child context. With the DynaFluxMixin, the Flux instance
 * will be available through the flux() method within the component.
 * @returns {Object} mixin
 * @deprecated all mixins in Dyna are being deprecated. Use consumeFlux() higher-order component instead.
 */
var DynaFluxMixin = {
  contextTypes : {
    flux: React.PropTypes.object.isRequired
  },

  flux : function() {
    return this.context.flux;
  }
};

/**
 * A higher-order component that add the Flux instance to the 'flux' props
 * @param component {ReactClass} component to be wrapped
 * @returns {ReactClass} the wrapped component
 */
var consumeFlux = function(component) {
  return React.createClass({
    contextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    render : function() {
      return React.createElement(component, assign({}, this.props, { flux: this.context.flux }));
    }
  });
};


/**
 * Store change listener specification
 * @typedef {Object} StoreChangeListenerSpec
 * @property {string}   store    - Flux store name
 * @property {function} listener - listener function
 */

/**
 * Get a list of stores this component will need to listen to
 * @callback getStoreListeners
 * @return {StoreChangeListenerSpec[]} an array of store change listener specification
 */

/**
 * A React Mixin that will make the component automatically listen and un-listen to Flux's store changes.
 * The component must implement a getStoreListeners() {@link getStoreListeners} method that returns
 * a list of store names and listener functions {@link StoreChangeListenerSpec}
 * @type {Object}
 * @deprecated all mixins in Dyna are being deprecated. Use consumeFluxStores() higher-order component instead.
 */
var StoreChangeListenersMixin = {
  contextTypes : {
    flux: React.PropTypes.object.isRequired
  },

  componentDidMount : function() {
    var flux = this.context.flux;

    if (!compare.isFunction(this.getStoreListeners)) {
      throw new Error('Component must have a getStoreListeners() method that returns a list of store to listen to and their corresponding handler.');
    }

    // add listeners
    var listeners = this.getStoreListeners();
    listeners.forEach(function(l) {
      if (!compare.isString(l.store)) {
        throw new Error('Store name in store listener definition must be a String');
      } else if (!compare.isFunction(l.listener)) {
        throw new Error('Store listener must be a Function');
      }

      flux.store(l.store).addChangeListener(l.listener);
    });

    // keeps a reference to the listeners for use in componentDidUnmount
    this._listeners = listeners;
  },

  componentWillUnmount : function() {
    var flux = this.context.flux;

    // remove listeners
    (this._listeners || []).forEach(function(l) {
      flux.store(l.store).removeChangeListener(l.listener);
    });
  }
};

/**
 * A higher-order component that add a FluxStoresAccessor to the 'fluxStores' props
 * @param component {ReactClass} component to be wrapped
 * @returns {ReactClass} the wrapped component
 */
var consumeFluxStores = function(component) {
  return React.createClass({
    contextTypes : {
      flux : React.PropTypes.object.isRequired
    },

    getInitialState : function() {
      return {
        fluxStores: new FluxStoresAccessor(this.context.flux)
      };
    },

    componentWillUnmount : function() {
      // remove all change handlers
      this.state.fluxStores.removeAllChangeHandlers();
    },

    render : function() {
      return React.createElement(component, assign({}, this.props, { fluxStores: this.state.fluxStores }));
    }
  });
};

/**
 * An object for accessing flux store within a React component
 * @param flux {Flux} flux instance
 * @constructor
 */
var FluxStoresAccessor = function(flux) {
  var _store_handlers = Immutable.Map();

  /**
   * Gets the store instance
   * @param store_name {String} name of the store
   * @return {Store} instance of the store
   */
  this.store = function(store_name) {
    return flux.store(store_name);
  };

  /**
   * Listens for store change
   * @param store_name {String} name of the store
   * @param handler {Function} change handler function
   */
  this.onChange = function(store_name, handler) {
    var handlers = _store_handlers.get(store_name) || Immutable.Set();

    this.store(store_name).addChangeListener(handler);
    _store_handlers = _store_handlers.set(store_name, handlers.add(handler));
  };

  /**
   * Removes a previously added change listener
   * @param store_name {String} name of the store
   * @param handler {Function} change handler function
   */
  this.removeChangeHandler = function(store_name, handler) {
    var handlers = _store_handlers.get(store_name);
    if (handlers && handlers.has(handler)) {
      // remove the change listener from the store
      self.store(store_name).removeChangeListener(handler);
      // remove the handler method from the _store_handlers list
      _store_handlers.set(store_name, handlers.remove(handler));
    }
  };

  /**
   * Removes all change listeners added
   */
  this.removeAllChangeHandlers = function() {
    var self = this;
    _store_handlers.forEach(function(sh, store_name) {
      // loops through each store handler list

      var store = self.store(store_name);
      sh.forEach(function(h) {
        // removes handler from the store
        store.removeChangeListener(h);
      });
    });
  };
};

module.exports = {
  DynaFluxMixin : DynaFluxMixin,
  StoreChangeListenersMixin: StoreChangeListenersMixin,
  consumeFlux : consumeFlux,
  consumeFluxStores : consumeFluxStores
};