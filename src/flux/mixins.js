'use strict';

var compare = require('../utils/compare');

/**
 * Function for creating a DynaFluxMixin that will consume the Flux instance provided by
 * the component's 'flux' prop. This will also pass the flux instance to its child through
 * child context. With the DynaFluxMixin, the Flux instance
 * will be available through the flux() method within the component.
 * @returns {Object} mixin
 */
var DynaFluxMixin = function() {
  var React = this.React;

  return {
    componentWillMount : function() {
      if (!this.props.flux && (!this.context || !this.context.flux)) {
        throw new Error('Could not find flux in component\'s context');
      }
    },

    contextTypes : {
      flux: React.PropTypes.object
    },

    childContextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    getChildContext : function() {
      return {
        flux: this.flux()
      };
    },

    flux : function() {
      return this.props.flux || (this.context && this.context.flux);
    }
  };
};
DynaFluxMixin.componentWillMount = function() {
  throw new Error('DynaFluxMixin must be created through dyna.DynaFluxMixin(), instead of being used directly.');
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
 */
var StoreChangeListenersMixin = {
  componentDidMount : function() {
    var self = this;
    if (!compare.isFunction(this.flux)) {
      throw new Error('Flux is not available in this component. Please use dyna.DynaFluxMixin() mixin to make the parent Flux instance available here.');
    } else if (!compare.isFunction(this.getStoreListeners)) {
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

      self.flux().store(l.store).addChangeListener(l.listener);
    });

    // keeps a reference to the listeners for use in componentDidUnmount
    this._listeners = listeners;
  },

  componentWillUnmount : function() {
    var self = this;

    // remove listeners
    (this._listeners || []).forEach(function(l) {
      self.flux().store(l.store).removeChangeListener(l.listener);
    });
  }
};

module.exports = {
  DynaFluxMixin : DynaFluxMixin,
  StoreChangeListenersMixin: StoreChangeListenersMixin
};