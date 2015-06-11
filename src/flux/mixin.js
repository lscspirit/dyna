'use strict';

/**
 * Constructor for creating a DynaFluxMixin that will pass the Flux instance to child components
 *
 * @param {React} React - instance of React
 * @returns {Object} mixin definition
 * @constructor
 *
 * @see {@link https://github.com/BinaryMuse/fluxxor/blob/master/lib/flux_mixin.js}
 */
var DynaFluxMixin = function(React) {
  return {
    componentWillMount : function() {
      if (!this.props.flux && (!this.context || !this.context.flux)) {
        throw new Error('Could not find flux in component\'s props or context');
      }
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
      return this.props.flux || (this.context && this.context.flux)
    }
  };
};

DynaFluxMixin.componentWillMount = function() {
  throw new Error('DynaFluxMixin must be created through dyna.DynaFluxMixin(React), instead of being used directly.');
};

module.exports = DynaFluxMixin;