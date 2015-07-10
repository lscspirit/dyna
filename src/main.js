'use strict';

var assign   = require('object-assign');
var DynaCore = require('./core/core');
var DynaFlux = require('./flux/flux');
var Utils    = require('./utils/utils');
var Addons   = require('./addons/addons');

require('./providers/providers');

var dyna = {
  version: '0.1.0',
  utils  : Utils,
  addons : Addons
};

assign(dyna, DynaCore);
assign(dyna, DynaFlux);

module.exports = dyna;
