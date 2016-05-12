'use strict';

var str     = require('underscore.string');
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
    if (compare.isUndefined(action_dispatcher)) throw new Error('action_dispatcher is undefined. Please provide a valid ActionDispatcher instance.');
    if (!compare.isFunction(action_dispatcher.emit)) throw new Error('Invalid ActionDispatcher. ActionDispatcher must have a emit() method.');
    action_dispatcher.emit(this.name(), this);

    return this;
  };
};

/**
 * Create a new action creator
 *
 * @param {string} namespace - a namespace string to distinguish this creator from others
 * @param {Object.<string,function>} actions - a map of action to payload function that converts arguments to payload object
 * @example
 * // setup the action creator
 * var chat_action_creator = createActionCreator('chat', {
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
 * chat_action_creator.instance(this.flux()).sendMessage(target_user, 'test message');
 *
 * // use chat_action_creator.ACTIONS.SEND_MESSAGE to listen for this action in the coordinator
 * var coordinator = function() {
 *   this.$listen = function() {
 *     return [{ action: chat_action_creator.ACTIONS.SEND_MESSAGE, handler: someHandlerFn }];
 *   };
 * }
 */
function createActionCreator(namespace, actions) {
  if (!compare.isString(namespace) || namespace.length == 0) throw new Error('namespace must not be an empty string');
  if (!compare.isObject(actions)) throw new Error('actions must be a plain javascript object');

  var self = this;

  // action functions
  var _actions = {};
  // action name constants
  var _action_names = {};

  // creates the action dispatch function
  for (var key in actions) {
    var name = str(key).underscored().toUpperCase().value();
    var payloadFn = actions[key];

    var ns_name = namespace + "." + key;
    _action_names[name] = ns_name;

    _actions[key] = function(act_name, fn) {
      return function() {
        var payload = compare.isFunction(fn) ? fn.apply(null, arguments) : null;
        return (new Action(act_name, payload)).dispatch(this._flux.action_dispatcher);
      };
    }(ns_name, payloadFn);
  }

  return {
    ACTIONS: _action_names,
    instance: function(flux) {
      return assign({ _flux: flux }, _actions);
    }
  };
}

/**
 * @deprecated since v0.1.4; use ActionCreator instead
 *
 * Create a factory object that can build Action according to the <tt>action_specs</tt>
 * @param {Object.<string, string>}   action_names - action name constants
 * @param {Object.<string, function>} action_specs - action specifications
 * @returns {ActionFactory} the factory object
 *
 * @example
 * var names   = {
 *   CLICKED: 'buzzer-clicked',
 *   SNOOZED: 'buzzer-snoozed'
 * };
 * var action_factory = dyna.createActionFactory(names, {
 *   buzzClick: function() {
 *     return this.createAction(this.ACTIONS.CLICKED, 'clicked');
 *   },
 *   buzzSnooze: function() {
 *     return this.createAction(this.ACTIONS.SNOOZED, 'snoozed');
 *   }
 * });
 *
 * // action_factory.ACTIONS.CLICKED;    => 'buzzer-clicked'
 *
 * // Component
 * var Buzzer = React.createClass({
 *   // ...
 *
 *   _buzzClick : function() {
 *     var click = action_factory.buzzClick();
 *     click.dispatch(this.props.flux.action_dispatcher);
 *   }
 * });
 */
function createActionFactory(action_names, action_specs) {
  /**
   * Factory class for creating Actions
   * @constructor
   */
  var ActionFactory = function() {
    this.ACTIONS = assign({}, action_names);

    /**
     * Create a new Action object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Action
     * @returns {Action} - the event object @see {@link Action}
     */
    this.createAction = function(name, payload) {
      return new Action(name, payload);
    };
  };

  ActionFactory.prototype = Object.create(action_specs);
  ActionFactory.prototype.constructor = ActionFactory;

  return new ActionFactory();
}

//
// Exports
//

module.exports = {
  createActionFactory: createActionFactory,
  createActionCreator: createActionCreator
};