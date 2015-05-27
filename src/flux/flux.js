'use strict';

/**
 * Flux architecture related components
 * @exports flux/flux
 */

var assign = require('object-assign');

var Stores       = require('./stores');
var Components   = require('./components');
var Coordinators = require('./coordinators');

var DynaFlux = {
  defineStores      : Stores.defineStores,
  defineComponents  : Components.defineComponents,
  defineCoordinators: Coordinators.defineCoordinators
};

module.exports = DynaFlux;
