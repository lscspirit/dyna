'use strict';

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
   * @throws {Error} if action_dispatcher is undefined or invalid
   */
  this.dispatch = function(action_dispatcher) {
    if (compare.isUndefined(action_dispatcher)) throw new Error('action_dispatcher is undefined. Please provide a valid ActionDispatcher instance.');
    if (!compare.isFunction(action_dispatcher.emit)) throw new Error('Invalid ActionDispatcher. ActionDispatcher must have a emit() method.');
    action_dispatcher.emit(this.name(), this);
  };
};

/**
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

module.exports = { createActionFactory: createActionFactory };