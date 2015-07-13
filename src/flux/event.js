'use strict';

var assign  = require('object-assign');
var compare = require('../utils/compare');

/**
 * Event object to be sent through the EventDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Event = function(name, payload) {
  var _name    = name || '*';
  var _payload = payload;

  var _action_id      = null;
  var _action_data    = null;
  var _tracking_state = null;

  /**
   * Return the name of the Event
   * @returns {string} event name
   */
  this.name = function() {
    return _name;
  };

  /**
   * Return the payload of the Event
   * @returns {*} payload data
   */
  this.payload = function() {
    return _payload;
  };

  /**
   * Dispatch this Event through a EventDispatcher
   * @param {EventDispatcher} event_dispatcher - dispatcher through which the Event is dispatched
   * @throws {Error} if event_dispatcher is undefined or invalid
   */
  this.dispatch = function(event_dispatcher) {
    if (compare.isUndefined(event_dispatcher)) throw new Error('event_dispatcher is undefined. Please provide a valid EventDispatcher instance.');
    if (!compare.isFunction(event_dispatcher.dispatch)) throw new Error('Invalid EventDispatcher. EventDispatcher must have a dispatch() method.');
    event_dispatcher.dispatch(this);
  };
};

/**
 * Create a factory object that can build Event according to the <tt>event_specs</tt>
 * @param {Object.<string, string>}   event_names - event name constants
 * @param {Object.<string, function>} event_specs - event specifications
 * @returns {EventFactory} the factory object
 *
 * @example
 * var names  = {
 *   STATUS_CHANGE: 'buzzer.status-change',
 *   SNOOZED      : 'buzzer.snoozed'
 * };
 * var event_factory = dyna.createEventFactory(names, {
 *   statusChange : function(status) {
 *     return this.createEvent(this.EVENTS.STATUS_CHANGE, status);
 *   },
 *   snoozed : function() {
 *     return this.createEvent(this.EVENTS.SNOOZED);
 *   }
 * });
 *
 * // event_factory.EVENTS.STATUS_CHANGE;   => 'buzzer.status-change'
 *
 * // Coordinator
 * var Buzzer = function() {
 *   // ...
 *
 *   function _buzzStatusChange(status) {
 *     event_factory.statusChange(status).dispatch(this.flux.event_dispatcher);
 *   }
 * }
 */
function createEventFactory(event_names, event_specs) {
  /**
   * Factory class for creating Events.
   * @constructor
   */
  var EventFactory = function() {
    this.EVENTS = assign({}, event_names);

    /**
     * Create a new Event object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Event
     * @returns {Event} - the event object @see {@link Event}
     */
    this.createEvent = function(name, payload) {
      return new Event(name, payload);
    };
  };

  EventFactory.prototype = Object.create(event_specs);
  EventFactory.prototype.constructor = EventFactory;

  return new EventFactory();
}

//
// Exports
//

module.exports = { createEventFactory: createEventFactory };