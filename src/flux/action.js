'use strict';

/**
 * Action object to be sent through the ActionDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Action = function(name, payload) {
  var _name    = name;
  var _payload = payload;

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
   */
  this.dispatch = function(action_dispatcher) {
    action_dispatcher.emit(this.name(), this);
  };
};

/**
 * Create a factory object that can build Action according to the <tt>action_specs</tt>
 * @param action_specs - action specifications
 * @returns {ActionFactory} the factory object
 *
 * @example
 * var actions = dyna.createActionFactory({
 *   buzzClick: function() {
 *     return this.createAction('buzzer-clicked', 'clicked');
 *   },
 *   buzzSnooze: function() {
 *     return this.createAction('buzzer-snoozed', 'snoozed');
 *   }
 * });
 *
 * // Component
 * var Buzzer = React.createClass({
 *   // ...
 *
 *   _buzzClick : function() {
 *     var click = actions.buzzClick();
 *     click.dispatch(this.props.flux.action_dispatcher);
 *   }
 * });
 */
function createActionFactory(action_specs) {
  /**
   * Factory class for creating Actions
   * @constructor
   */
  var ActionFactory = function() {
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