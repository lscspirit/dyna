'use strict';

var check   = require('check-types');
var assign  = require('object-assign');
var compare = require('../utils/compare');

var action_ids = 1;

/**
 * Action object to be sent through the ActionDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Action = function(name, payload) {
  var _id      = action_ids++;
  var _name    = name;
  var _payload = payload;

  this.id = function() {
    return _id;
  };

  /**
   * Return the name of the Action
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Action
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Action through a ActionDispatcher
   * @param {ActionDispatcher} action_dispatcher - dispatcher through which the Action is dispatched
   * @returns {Action} the action object dispatched
   * @throws {Error} if action_dispatcher is undefined or invalid
   */
  this.dispatch = function(action_dispatcher) {
    check.assert.object(action_dispatcher, 'action_dispatcher is undefined. Please provide a valid ActionDispatcher instance.');
    check.assert.function(action_dispatcher.emit, 'Invalid ActionDispatcher. ActionDispatcher must have a emit() method.');

    action_dispatcher.emit(this.name(), this);

    return this;
  };
};

/**
 * Create a new action factory
 *
 * @param {string} namespace - a namespace string to distinguish this creator from others
 * @param {Object.<string,function>} actions - a map of action to payload function that converts arguments to payload object
 * @return {ActionFactory} an ActionFactory class customized for the actions provided
 *
 * @example
 * // setup the action factory
 * var ChatActionFactory = createActionFactory('chat', {
 *   sendMessage: function(recipient, message_txt) {
 *     // turn arguments into a payload object
 *     return { recipient_id: recipient.id, msg: message_txt };
 *   },
 *   fetchMessage: function(user) {
 *     return { user_id: user.id };
 *   }
 * });
 *
 * // dispatch a sendMessage action
 * ChatActionFactory(this.flux()).sendMessage(target_user, 'test message');
 *
 * // use ChatActionFactory.ACTIONS.sendMessage to listen for this action in the coordinator
 * var coordinator = function() {
 *   this.$listen = function() {
 *     return [{ action: ChatActionFactory.ACTIONS.sendMessage, handler: someHandlerFn }];
 *   };
 * }
 */
function createActionFactory(namespace, actions) {
  check.assert.nonEmptyString(namespace, 'namespace must be a non-empty string');
  check.assert.object(actions, 'actions must be an object');


  var ActionFactory = function(flux) {
    if (!(this instanceof ActionFactory)) return new ActionFactory(flux);
    this._flux = flux;
  };
  ActionFactory.ACTIONS = {};

  for (var key in actions) {
    (function(act_key, act_name, fn) {
      // adds the event name to ActionFactory.ACTIONS
      ActionFactory.ACTIONS[act_key] = act_name;
      // adds the dispatch function to the EventFactory prototype
      ActionFactory.prototype[act_key] = function() {
        var payload = check.function(fn) ? fn.apply(null, arguments) : null;
        return (new Action(act_name, payload)).dispatch(this._flux.action_dispatcher);
      };
    })(key, namespace + '.' + key, actions[key]);
  }

  return ActionFactory;
}

//
// Exports
//

module.exports = {
  createActionFactory: createActionFactory,
};