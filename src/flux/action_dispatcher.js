'use strict';

var recipes = require('../core/provider_recipes');
var EventEmitter = require('event-emitter');

var emitter = EventEmitter();

/**
 * Add a event listener
 * @param {string}    action_name - action name
 * @param {function}  listener    - listener function
 * @example
 * addListener('user_click', function(payload) {
 *   payload.position
 * });
 */
function addListener(action_name, listener) {
  emitter.on(action_name, listener);
}

/**
 * Remove a event listener
 * @param {string}    action_name - action name
 * @param {function}  listener    - listener function
 * @example
 * var listener;
 * addListener('user_click', listener = function(payload) {
 *   payload.position
 * });
 * removeListener('user_click', listener);
 */
function removeListener(action_name, listener) {
  emitter.off(action_name, listener);
}

/**
 * Emit a event
 * @param {string} action_name - action name
 * @param {{}}     payload     - payload data
 * @example
 * emit('user_click', { position: { x: 100, y: 50 } });
 */
function emit(action_name, payload) {
  emitter.emit(action_name, payload);
}

var action_dispatcher = {
  addListener     : addListener,
  removeListenter : removeListener,
  emit            : emit
};

recipes.value('$actionDispatcher', action_dispatcher);

module.exports = action_dispatcher;