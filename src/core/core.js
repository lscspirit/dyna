'use strict';

/**
 * Dyna Core
 * @exports core/core
 */

var assign = require('object-assign');

var Injector        = require('./injector');
var ProviderManager = require('./provider_manager');
var ProviderRecipes = require('./provider_recipes');
var ExternalLib     = require('./external_lib');
var Lifecycle       = require('./lifecycle');

var core = {
  $provider: ProviderManager,
  $injector: Injector
};

assign(core, ProviderRecipes);
assign(core, ExternalLib);
assign(core, Lifecycle);

module.exports = core;
