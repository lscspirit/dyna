'use strict';

/**
 * Action Dispatcher
 * @module ActionDispatcher
 */

var EventEmitter = require('event-emitter');

/**
 * Action Dispatcher
 * @alias module:ActionDispatcher
 */
var ActionDispatcher = function() {
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
  this.addListener = function(action_name, listener) {
    emitter.on(action_name, listener);
  };

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
  this.removeListener = function(action_name, listener) {
    emitter.off(action_name, listener);
  };

  /**
   * Emit a event
   * @param {string} action_name - action name
   * @param {{}}     payload     - payload data
   * @example
   * emit('user_click', { position: { x: 100, y: 50 } });
   */
  this.emit = function(action_name, payload) {
    emitter.emit(action_name, payload);
  };
};

module.exports = ActionDispatcher;