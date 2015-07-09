'use strict';

/**
 * Function for creating a DynaFluxMixin that will pass the Flux instance to child components
 * through childContext. With the DynaFluxMixin, the Flux instance will be available through the flux()
 * method within the component.
 * @returns {Object} mixin
 *
 * @see {@link https://github.com/BinaryMuse/fluxxor/blob/master/lib/flux_mixin.js}
 */
var DynaFluxMixin = function() {
  var React = this.React;

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
      return this.props.flux || (this.context && this.context.flux);
    }
  };
};
DynaFluxMixin.componentWillMount = function() {
  throw new Error('DynaFluxMixin must be created through dyna.DynaFluxMixin(), instead of being used directly.');
};

/**
 * Function for creating a DynaFluxConsumerMixin that will consume the Flux instance provided by
 * the component's owner through owner's context. With the DynaFluxConsumerMixin, the Flux instance
 * will be available through the flux() method within the component.
 * @returns {Object} mixin
 */
var DynaFluxConsumerMixin = function() {
  var React = this.React;

  return {
    componentWillMount : function() {
      if (!this.context || !this.context.flux) {
        throw new Error('Could not find flux in component\'s context');
      }
    },

    contextTypes : {
      flux: React.PropTypes.object.isRequired
    },

    flux : function() {
      return this.context && this.context.flux;
    }
  };
};
DynaFluxConsumerMixin.componentWillMount = function() {
  throw new Error('DynaFluxConsumerMixin must be created through dyna.DynaFluxConsumerMixin(), instead of being used directly.');
};

/**
 * Function for create a ComponentFluxMixin that will automatically creates a Flux instance upon mounting of the
 * component.
 * @param {string|string[]} coordinators - names of the coordinators to be used within this Flux
 * @param {string|string[]} stores       - names of the stores to be used within this Flux
 * @returns {Object} mixin
 */
var ComponentFluxMixin = function(coordinators, stores) {
  var dyna  = this;
  var React = dyna.React;

  return {
    componentWillMount : function() {
      var flux = new dyna.flux(coordinators, stores);
      dyna.start(flux);

      this.setState({
        flux: flux.componentContext()
      });
    },

    componentDidUnmount : function() {
      dyna.stop(this.state.flux);
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
      return this.state.flux;
    }
  };
};
ComponentFluxMixin.componentWillMount = function() {
  throw new Error('ComponentFluxMixin must be created through dyna.ComponentFluxMixin(coordinators, stores), instead of being used directly.');
};

module.exports = {
  ComponentFluxMixin   : ComponentFluxMixin,
  DynaFluxMixin        : DynaFluxMixin,
  DynaFluxConsumerMixin: DynaFluxConsumerMixin
};