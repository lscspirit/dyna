'use strict';

var check   = require('check-types');
var assign  = require('object-assign');

/**
 * Event object to be sent through the EventDispatcher
 * @param {string} name    - name of the event
 * @param {*}      payload - any data to be sent along with this Event
 * @constructor
 */
var Event = function(name, payload) {
  var _name    = name || '*';
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
   * @throws {Error} if event_dispatcher is undefined or invalid
   */
  this.dispatch = function(event_dispatcher) {
    check.assert.object(event_dispatcher, 'event_dispatcher is undefined. Please provide a valid EventDispatcher instance.');
    check.assert.function(event_dispatcher.dispatch, 'Invalid EventDispatcher. EventDispatcher must have a dispatch() method.');

    event_dispatcher.dispatch(this);
  };
};

/**
 * Create a new event factory
 *
 * @param {string} namespace - a namespace string to distinguish this creator from others
 * @param {Object.<string,function>} events - a map of event to payload function that converts arguments to payload object
 * @return {EventFactory} an EventFactory class customized for the events provided
 *
 * @example
 * var ChatEventFactory = dyna.createEventFactory('chat', {
 *   messageReceived: function(new_message) { return { message: new_message }; }
 * });
*
 * // Coordinator
 * var ChatRoom = function() {
 *   // ...
 *
 *   function _newMessageReceived(message) {
 *     ChatEventFactory(this.flux).messageReceived(message);
 *   }
 * }
 *
 * // In Store
 * var ChatMessageStore = {
 *   $processEvent : function(event) {
 *     if (event.name() == ChatEventFactory.EVENTS.messageReceived) {
 *       this.receivedMessage(event.payload());
 *     }
 *   }
 * }
 */
function createEventFactory(namespace, events) {
  check.assert.nonEmptyString(namespace, 'namespace must be a non-empty string');
  check.assert.object(events, 'events must be an object');

  var EventFactory = function(flux) {
    if (!(this instanceof EventFactory)) return new EventFactory(flux);
    this._flux = flux;
  };
  EventFactory.EVENTS = {};

  for (var key in events) {
    (function(evt_key, evt_name, fn) {
      // adds the event name to EventFactory.EVENTS
      EventFactory.EVENTS[evt_key] = evt_name;
      // adds the dispatch function to the EventFactory prototype
      EventFactory.prototype[evt_key] = function() {
        var payload = check.function(fn) ? fn.apply(null, arguments) : null;
        return (new Event(evt_name, payload)).dispatch(this._flux.event_dispatcher);
      };
    })(key, namespace + '.' + key, events[key]);
  }

  return EventFactory;
}
//
// Exports
//

module.exports = {
  createEventFactory: createEventFactory
};