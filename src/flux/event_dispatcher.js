'use strict';

var recipes = require('../core/provider_recipes');
var Flux    = require('flux');

var event_dispatcher = new Flux.Dispatcher();

recipes.value('$eventDispatcher', event_dispatcher);

module.exports = event_dispatcher;