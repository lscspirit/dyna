'use strict';

/**
 * Event object to be sent through the EventDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Event = function(name, payload) {
  var _name    = name;
  var _payload = payload;

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
   */
  this.dispatch = function(event_dispatcher) {
    event_dispatcher.dispatch(this);
  };
};

/**
 * Create a factory object that can build Action according to the <tt>event_specs</tt>
 * @param {object} event_specs - event specifications
 * @returns {EventFactory} the factory object
 *
 * @example
 * var events = dyna.createEventFactory({
 *   statusChange : function(status) {
 *     return this.createEvent('buzzer.status-change', status);
 *   },
 *   snoozed : function() {
 *     return this.createEvent('buzzer.snoozed');
 *   }
 * });
 *
 * // Coordinator
 * var Buzzer = function() {
 *   // ...
 *
 *   function _buzzStatusChange(status) {
 *     events.statusChange(status).dispatch(this.flux.event_dispatcher);
 *   }
 * }
 */
function createEventFactory(event_specs) {
  /**
   * Factory class for creating Events.
   * @constructor
   */
  var EventFactory = function() {
    /**
     * Create a new Event object
     * @param {string} name    - name of the event
     * @param {*}      payload - any data to be sent along with this Event
     * @returns {Event} - the event object @see {@link Event}
     */
    this.createEvent = function(name, payload) {
      return new Event(name, payload);
    }
  };

  EventFactory.prototype = Object.create(event_specs);
  EventFactory.prototype.constructor = EventFactory;

  return new EventFactory();
}

//
// Exports
//

module.exports = { createEventFactory: createEventFactory };