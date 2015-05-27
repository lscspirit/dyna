'use strict';

var assign   = require('object-assign');
var DynaCore = require('./core/core');
var DynaFlux = require('./flux/flux');
var Utils    = require('./utils/utils');

require('./providers/providers');

var dyna = {
  version: '0.1.0',
  utils  : Utils
};

assign(dyna, DynaCore);
assign(dyna, DynaFlux);

module.exports = dyna;
